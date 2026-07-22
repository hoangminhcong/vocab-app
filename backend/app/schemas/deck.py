from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DeckBase(BaseModel):
    title: str
    description: Optional[str] = None
    cover_image: Optional[str] = None

class DeckCreate(DeckBase):
    pass

class DeckUpdate(DeckBase):
    title: Optional[str] = None

class DeckInDBBase(DeckBase):
    id: int
    folder_id: int
    total_words: int
    learned_words: int = 0
    survival_wins: int = 0
    next_wither_at: Optional[datetime] = None
    last_reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Deck(DeckInDBBase):
    pass
