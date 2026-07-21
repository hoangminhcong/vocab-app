from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from app.api import deps
from app.schemas.vocabulary import Vocabulary, VocabularyCreate, VocabularyUpdate
from app.models.vocabulary import Vocabulary as VocabularyModel
from app.models.deck import Deck as DeckModel
from app.models.folder import Folder as FolderModel
from app.models.user import User

router = APIRouter()

@router.get("/search", response_model=List[Vocabulary])
def search_vocabularies(
    *,
    db: Session = Depends(deps.get_db),
    q: str,
    current_user: User = Depends(deps.get_current_user)
):
    """
    Search vocabularies across all decks by english word or meaning.
    """
    search_term = f"%{q}%"
    vocabularies = db.query(VocabularyModel).join(DeckModel).join(FolderModel).filter(
        FolderModel.user_id == current_user.id,
        (VocabularyModel.english_word.ilike(search_term)) | 
        (VocabularyModel.vi_meaning.ilike(search_term)) |
        (VocabularyModel.en_meaning.ilike(search_term))
    ).limit(50).all()
    
    return vocabularies

@router.get("/deck/{deck_id}", response_model=List[Vocabulary])
def read_vocabularies_by_deck(
    *,
    db: Session = Depends(deps.get_db),
    deck_id: int,
    current_user: User = Depends(deps.get_current_user)
):
    deck = db.query(DeckModel).join(FolderModel).filter(DeckModel.id == deck_id, FolderModel.user_id == current_user.id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    
    vocabularies = db.query(VocabularyModel).filter(VocabularyModel.deck_id == deck_id).all()
    return vocabularies

from app.services.tts import generate_and_update_vocab_audio

@router.post("/deck/{deck_id}", response_model=Vocabulary)
def create_vocabulary(
    *,
    db: Session = Depends(deps.get_db),
    deck_id: int,
    vocab_in: VocabularyCreate,
    current_user: User = Depends(deps.get_current_user),
    background_tasks: BackgroundTasks
):
    deck = db.query(DeckModel).join(FolderModel).filter(DeckModel.id == deck_id, FolderModel.user_id == current_user.id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    
    vocab = VocabularyModel(
        deck_id=deck_id,
        **vocab_in.model_dump()
    )
    db.add(vocab)
    
    # Increment total words in deck
    deck.total_words += 1
    
    db.commit()
    db.refresh(vocab)
    
    if not vocab.audio_url and vocab.english_word:
        background_tasks.add_task(generate_and_update_vocab_audio, vocab.id, vocab.english_word)
        
    return vocab

@router.delete("/{id}", response_model=Vocabulary)
def delete_vocabulary(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_user)
):
    vocab = db.query(VocabularyModel).join(DeckModel).join(FolderModel).filter(VocabularyModel.id == id, FolderModel.user_id == current_user.id).first()
    if not vocab:
        raise HTTPException(status_code=404, detail="Vocabulary not found")
    
    # Decrement total words
    deck = db.query(DeckModel).filter(DeckModel.id == vocab.deck_id).first()
    if deck:
        deck.total_words -= 1
        
    db.delete(vocab)
    db.commit()
    return vocab

@router.get("/{id}", response_model=Vocabulary)
def read_vocabulary(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_user)
):
    vocab = db.query(VocabularyModel).join(DeckModel).join(FolderModel).filter(VocabularyModel.id == id, FolderModel.user_id == current_user.id).first()
    if not vocab:
        raise HTTPException(status_code=404, detail="Vocabulary not found")
    return vocab

@router.put("/{id}", response_model=Vocabulary)
def update_vocabulary(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    vocab_in: VocabularyUpdate,
    current_user: User = Depends(deps.get_current_user),
    background_tasks: BackgroundTasks
):
    vocab = db.query(VocabularyModel).join(DeckModel).join(FolderModel).filter(VocabularyModel.id == id, FolderModel.user_id == current_user.id).first()
    if not vocab:
        raise HTTPException(status_code=404, detail="Vocabulary not found")
    
    update_data = vocab_in.model_dump(exclude_unset=True)
    
    # Check if english_word is being updated
    word_changed = "english_word" in update_data and update_data["english_word"] != vocab.english_word
    
    for field in update_data:
        setattr(vocab, field, update_data[field])
        
    db.add(vocab)
    db.commit()
    db.refresh(vocab)
    
    if word_changed or (not vocab.audio_url and vocab.english_word):
        background_tasks.add_task(generate_and_update_vocab_audio, vocab.id, vocab.english_word)
        
    return vocab
