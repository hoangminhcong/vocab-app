from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class StudyProgressBase(BaseModel):
    vocab_id: int
    level: int = 0
    step_corrects: int = 0
    target_corrects: int = 1
    correct_count: int = 0
    wrong_count: int = 0
    last_reviewed_at: Optional[datetime] = None

class StudyProgressCreate(BaseModel):
    vocab_id: int

class StudyProgressUpdate(BaseModel):
    is_correct: bool

class StudyProgressInDBBase(StudyProgressBase):
    id: int
    user_id: int

    model_config = {"from_attributes": True}

class StudyProgress(StudyProgressInDBBase):
    pass
