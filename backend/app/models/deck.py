from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base

class Deck(Base):
    __tablename__ = "decks"

    id = Column(Integer, primary_key=True, index=True)
    folder_id = Column(Integer, ForeignKey("folders.id"))
    title = Column(String, index=True)
    description = Column(String, nullable=True)
    cover_image = Column(String, nullable=True)
    total_words = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    folder = relationship("Folder", back_populates="decks")
    vocabularies = relationship("Vocabulary", back_populates="deck", cascade="all, delete-orphan")
