from sqlalchemy import Column, Integer, String, Date, ForeignKey
from app.db.database import Base

class MissedWateringLog(Base):
    __tablename__ = "missed_waterings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    deck_id = Column(Integer, ForeignKey("decks.id", ondelete="SET NULL"), nullable=True)
    deck_title = Column(String, nullable=False)
    date = Column(Date, nullable=False, index=True)
