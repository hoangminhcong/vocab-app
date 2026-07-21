from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
import pandas as pd
import io
from app.api import deps
from app.models.deck import Deck as DeckModel
from app.models.folder import Folder as FolderModel
from app.models.vocabulary import Vocabulary as VocabularyModel
from app.models.user import User
from app.services.tts import generate_and_update_vocab_audio
import os
from app.core.config import settings
import json
import google.generativeai as genai

router = APIRouter()

@router.post("/deck/{deck_id}")
async def import_vocabularies(
    *,
    db: Session = Depends(deps.get_db),
    deck_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_user),
    background_tasks: BackgroundTasks
):
    deck = db.query(DeckModel).join(FolderModel).filter(DeckModel.id == deck_id, FolderModel.user_id == current_user.id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
        
    contents = await file.read()
    filename = file.filename
    
    try:
        if filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
            df.columns = [col.lower().strip() for col in df.columns]
        elif filename.endswith('.xlsx') or filename.endswith('.xls'):
            df = pd.read_excel(io.BytesIO(contents))
            df.columns = [col.lower().strip() for col in df.columns]
        elif filename.endswith('.txt'):
            lines = contents.decode('utf-8').splitlines()
            if lines and ('english_word' in lines[0].lower() or 'word\t' in lines[0].lower()):
                df = pd.read_csv(io.BytesIO(contents), sep='\t')
                df.columns = [col.lower().strip() for col in df.columns]
            else:
                data = []
                for line in lines:
                    if not line.strip(): continue
                    parts = line.split('\t')
                    if len(parts) >= 3:
                        data.append({
                            'english_word': parts[0].strip(),
                            'ipa': parts[1].strip(),
                            'vi_meaning': parts[2].strip(),
                            'en_meaning': parts[3].strip() if len(parts) > 3 else None
                        })
                    elif len(parts) == 2:
                        data.append({
                            'english_word': parts[0].strip(),
                            'vi_meaning': parts[1].strip()
                        })
                df = pd.DataFrame(data)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")
            
        # Expected columns: english_word (required), vi_meaning (required), ipa, part_of_speech, en_meaning, example, difficulty, tags
        if 'english_word' not in df.columns or 'vi_meaning' not in df.columns:
            raise HTTPException(status_code=400, detail="File must contain 'english_word' and 'vi_meaning' columns")
            
        # Replace nan with None
        df = df.where(pd.notnull(df), None)
        
        vocab_count = 0
        for _, row in df.iterrows():
            if not row['english_word'] or not row['vi_meaning']:
                continue
                
            vocab = VocabularyModel(
                deck_id=deck_id,
                english_word=str(row['english_word']),
                vi_meaning=str(row['vi_meaning']),
                ipa=str(row.get('ipa', '')) if row.get('ipa') else None,
                part_of_speech=str(row.get('part_of_speech', '')) if row.get('part_of_speech') else None,
                en_meaning=str(row.get('en_meaning', '')) if row.get('en_meaning') else None,
                example=str(row.get('example', '')) if row.get('example') else None,
                difficulty=int(row.get('difficulty', 1)) if row.get('difficulty') else 1,
                tags=str(row.get('tags', '')) if row.get('tags') else None,
            )
            db.add(vocab)
            db.flush() # To get vocab.id
            
            # Add TTS background task
            background_tasks.add_task(generate_and_update_vocab_audio, vocab.id, vocab.english_word)
            
            vocab_count += 1
            
        deck.total_words += vocab_count
        db.commit()
        
        return {"msg": f"Successfully imported {vocab_count} words"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error parsing file: {str(e)}")

@router.post("/deck/{deck_id}/image")
async def import_vocabularies_from_image(
    *,
    db: Session = Depends(deps.get_db),
    deck_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_user),
    background_tasks: BackgroundTasks
):
    deck = db.query(DeckModel).join(FolderModel).filter(DeckModel.id == deck_id, FolderModel.user_id == current_user.id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
        
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured in .env")
        
    try:
        contents = await file.read()
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-flash-latest')
        
        prompt = """
        Phân tích ảnh chụp chữ viết tay danh sách từ vựng này.
        Trả về kết quả CỰC KỲ NGHIÊM NGẶT dưới dạng 1 MẢNG JSON hợp lệ. KHÔNG BAO GỒM BẤT KỲ VĂN BẢN NÀO KHÁC BÊN NGOÀI MẢNG JSON, KHÔNG DÙNG MARKDOWN QUOTE (```json).
        
        Mỗi object trong mảng phải có các trường sau:
        - "english_word": Từ vựng chính tiếng Anh.
        - "vi_meaning": Nghĩa tiếng Việt. BẮT BUỘC phải ghép thêm loại từ viết tắt ngắn gọn (n, v, adj, adv, prep, conj...) trong ngoặc đơn lên phía trước nghĩa. Ví dụ: "(adj) đông đúc", "(v) chạy", "(n) ngôi nhà".
        - "ipa": Phiên âm quốc tế (IPA). Tự điền chuẩn xác.
        - "synonyms": Các từ đồng nghĩa. NẾU trong ảnh người dùng viết cấu trúc "A = B = C" thì A là english_word, và "B, C" (cách nhau bởi dấu phẩy) sẽ được lưu vào trường synonyms này. Nếu không có thì để rỗng "".
        
        Ví dụ kết quả trả về:
        [
          {"english_word": "hello", "vi_meaning": "(n) xin chào", "ipa": "/həˈloʊ/", "synonyms": "hi, greetings"}
        ]
        """
        
        image_parts = [
            {
                "mime_type": file.content_type,
                "data": contents
            }
        ]
        
        response = model.generate_content([image_parts[0], prompt])
        
        response_text = response.text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()
            
        data = json.loads(response_text)
        
        if not isinstance(data, list):
            raise ValueError("AI did not return a JSON array")
            
        vocab_count = 0
        for item in data:
            if not item.get("english_word") or not item.get("vi_meaning"):
                continue
                
            vocab = VocabularyModel(
                deck_id=deck_id,
                english_word=str(item.get('english_word')).strip(),
                vi_meaning=str(item.get('vi_meaning')).strip(),
                ipa=str(item.get('ipa')).strip() if item.get('ipa') else None,
                part_of_speech=str(item.get('part_of_speech')).strip() if item.get('part_of_speech') else None,
                synonyms=str(item.get('synonyms')).strip() if item.get('synonyms') else None,
                difficulty=1
            )
            db.add(vocab)
            db.flush()
            
            background_tasks.add_task(generate_and_update_vocab_audio, vocab.id, vocab.english_word)
            vocab_count += 1
            
        deck.total_words += vocab_count
        db.commit()
        
        return {"msg": f"Successfully imported {vocab_count} words from image"}
        
    except json.JSONDecodeError:
        db.rollback()
        raise HTTPException(status_code=400, detail="AI response format was invalid JSON. Please try again.")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Image processing failed: {str(e)}")
