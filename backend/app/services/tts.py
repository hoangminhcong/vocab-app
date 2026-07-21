import edge_tts
import os
import uuid
import asyncio

STATIC_AUDIO_DIR = "static/audio"

def ensure_dir():
    if not os.path.exists(STATIC_AUDIO_DIR):
        os.makedirs(STATIC_AUDIO_DIR)

async def generate_audio_file(text: str) -> str:
    """
    Generates an MP3 file using Edge-TTS and returns the file path (URL).
    """
    ensure_dir()
    filename = f"{uuid.uuid4().hex}.mp3"
    filepath = os.path.join(STATIC_AUDIO_DIR, filename)
    
    # Use a standard en-US voice
    voice = "en-US-AriaNeural"
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(filepath)
    
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
