import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

from app.db.database import SessionLocal
from app.models.vocabulary import Vocabulary
from app.services.tts import generate_audio_file

async def migrate_audio():
    db = SessionLocal()
    vocabularies = db.query(Vocabulary).all()
    total = len(vocabularies)
    
    print(f"Found {total} vocabularies to process.")
    
    for i, vocab in enumerate(vocabularies):
        # We process all of them because local files are gone and we want them all on Supabase.
        # We can skip if it's already a supabase URL
        if vocab.audio_url and "supabase.co" in vocab.audio_url:
            print(f"[{i+1}/{total}] Skipping {vocab.english_word}, already has Supabase URL")
            continue
            
        print(f"[{i+1}/{total}] Generating audio for: {vocab.english_word}...")
        try:
            new_url = await generate_audio_file(vocab.english_word)
            vocab.audio_url = new_url
            db.commit()
            print(f" -> Success! URL: {new_url}")
        except Exception as e:
            print(f" -> Failed to generate audio for {vocab.english_word}: {e}")
            
    db.close()
    print("Migration complete!")

if __name__ == "__main__":
    asyncio.run(migrate_audio())
