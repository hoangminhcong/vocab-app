from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class FolderBase(BaseModel):
    name: str
    description: Optional[str] = None

class FolderCreate(FolderBase):
    pass

class FolderUpdate(FolderBase):
    name: Optional[str] = None

class FolderInDBBase(FolderBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Folder(FolderInDBBase):
    pass
