import edge_tts
import os
import uuid
import asyncio

STATIC_AUDIO_DIR = "static/audio"

def ensure_dir():
    if not os.path.exists(STATIC_AUDIO_DIR):
        os.makedirs(STATIC_AUDIO_DIR)

from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

def get_supabase_client() -> Client | None:
    if SUPABASE_URL and SUPABASE_KEY:
        return create_client(SUPABASE_URL, SUPABASE_KEY)
    return None

async def generate_audio_file(text: str) -> str:
    """
    Generates an MP3 file using Edge-TTS, uploads it to Supabase Storage (if configured),
    and returns the public URL.
    """
    ensure_dir()
    filename = f"{uuid.uuid4().hex}.mp3"
    filepath = os.path.join(STATIC_AUDIO_DIR, filename)
    
    # Use a standard en-US voice
    voice = "en-US-AriaNeural"
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(filepath)
    
    supabase = get_supabase_client()
    if supabase:
        try:
            with open(filepath, 'rb') as f:
                supabase.storage.from_("audio").upload(
                    path=filename,
                    file=f,
                    file_options={"content-type": "audio/mpeg"}
                )
            # Get public URL
            res = supabase.storage.from_("audio").get_public_url(filename)
            # Delete local file after upload
            os.remove(filepath)
            return res
        except Exception as e:
            print(f"Error uploading to Supabase Storage: {e}")
            return f"/static/audio/{filename}"
    
    return f"/static/audio/{filename}"

def run_tts_sync(text: str) -> str:
    """
    Wrapper to run TTS synchronously if needed in standard routes.
    """
    return asyncio.run(generate_audio_file(text))

async def async_generate_and_update_vocab_audio(vocab_id: int, text: str):
    from app.db.database import SessionLocal
    from app.models.vocabulary import Vocabulary
    
    audio_url = await generate_audio_file(text)
    
    db = SessionLocal()
    try:
        vocab = db.query(Vocabulary).filter(Vocabulary.id == vocab_id).first()
        if vocab:
            vocab.audio_url = audio_url
            db.add(vocab)
            db.commit()
    finally:
        db.close()

def generate_and_update_vocab_audio(vocab_id: int, text: str):
    """
    Function meant to be run in FastAPI BackgroundTasks.
    It generates the audio file and updates the Vocabulary record in the database.
    """
    asyncio.run(async_generate_and_update_vocab_audio(vocab_id, text))
