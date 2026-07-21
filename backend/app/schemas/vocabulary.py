from pydantic import BaseModel
from typing import Optional

class VocabularyBase(BaseModel):
    english_word: str
    ipa: Optional[str] = None
    part_of_speech: Optional[str] = None
    vi_meaning: str
    en_meaning: Optional[str] = None
    example: Optional[str] = None
    synonyms: Optional[str] = None
    antonyms: Optional[str] = None
    image_url: Optional[str] = None
    audio_url: Optional[str] = None
    notes: Optional[str] = None
    difficulty: int = 1
    tags: Optional[str] = None

class VocabularyCreate(VocabularyBase):
    pass

class VocabularyUpdate(VocabularyBase):
    english_word: Optional[str] = None
    vi_meaning: Optional[str] = None

class VocabularyInDBBase(VocabularyBase):
    id: int
    deck_id: int

    class Config:
        from_attributes = True

class Vocabulary(VocabularyInDBBase):
    pass
