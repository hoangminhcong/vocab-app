from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.db.database import Base
from sqlalchemy.orm import relationship

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    avatar_url = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    current_streak = Column(Integer, default=0)
    last_study_date = Column(DateTime(timezone=True), nullable=True)

    folders = relationship("Folder", back_populates="owner")
    study_progress = relationship("StudyProgress", back_populates="user")

