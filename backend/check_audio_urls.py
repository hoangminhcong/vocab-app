from app.db.database import SessionLocal
from app.models.vocabulary import Vocabulary
try:
    db = SessionLocal()
    urls = [v.audio_url for v in db.query(Vocabulary).all()]
    print("Audio URLs:", urls)
    db.close()
except Exception as e:
    print("ERROR:", e)
