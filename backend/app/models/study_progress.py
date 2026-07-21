from sqlalchemy import Column, Integer, ForeignKey, Float, DateTime
from sqlalchemy.orm import relationship
from app.db.database import Base

class StudyProgress(Base):
    __tablename__ = "study_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    vocab_id = Column(Integer, ForeignKey("vocabularies.id"))
    
    level = Column(Integer, default=0)
    step_corrects = Column(Integer, default=0)
    target_corrects = Column(Integer, default=1)
    correct_count = Column(Integer, default=0)
    wrong_count = Column(Integer, default=0)
    
    last_reviewed_at = Column(DateTime(timezone=True), nullable=True)
    ease_factor = Column(Float, default=2.5) # SM-2 algorithm ease factor

    user = relationship("User", back_populates="study_progress")
    vocabulary = relationship("Vocabulary", back_populates="study_progress")
