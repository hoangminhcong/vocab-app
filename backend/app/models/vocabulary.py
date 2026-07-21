from sqlalchemy import Column, Integer, String, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.db.database import Base

class Vocabulary(Base):
    __tablename__ = "vocabularies"

    id = Column(Integer, primary_key=True, index=True)
    deck_id = Column(Integer, ForeignKey("decks.id"))
    english_word = Column(String, index=True)
    ipa = Column(String, nullable=True)
    part_of_speech = Column(String, nullable=True)
    vi_meaning = Column(String)
    en_meaning = Column(String, nullable=True)
    example = Column(String, nullable=True)
    synonyms = Column(String, nullable=True)
    antonyms = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    audio_url = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    difficulty = Column(Integer, default=1)
    tags = Column(String, nullable=True) # Stored as comma separated or JSON

    deck = relationship("Deck", back_populates="vocabularies")
    study_progress = relationship("StudyProgress", back_populates="vocabulary", cascade="all, delete-orphan")
