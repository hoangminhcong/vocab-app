from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.api import deps
from app.schemas.folder import Folder, FolderCreate, FolderUpdate
from app.models.folder import Folder as FolderModel
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[Folder])
def read_folders(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_user)
):
    folders = db.query(FolderModel).filter(FolderModel.user_id == current_user.id).offset(skip).limit(limit).all()
    return folders

@router.post("/", response_model=Folder)
def create_folder(
    *,
    db: Session = Depends(deps.get_db),
    folder_in: FolderCreate,
    current_user: User = Depends(deps.get_current_user)
):
    folder = FolderModel(
        name=folder_in.name,
        description=folder_in.description,
        user_id=current_user.id
    )
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return folder

@router.get("/{id}", response_model=Folder)
def read_folder(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_user)
):
    folder = db.query(FolderModel).filter(FolderModel.id == id, FolderModel.user_id == current_user.id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    return folder

@router.delete("/{id}", response_model=Folder)
def delete_folder(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_user)
):
    folder = db.query(FolderModel).filter(FolderModel.id == id, FolderModel.user_id == current_user.id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    db.delete(folder)
    db.commit()
    return folder

@router.put("/{id}", response_model=Folder)
def update_folder(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    folder_in: FolderUpdate,
    current_user: User = Depends(deps.get_current_user)
):
    folder = db.query(FolderModel).filter(FolderModel.id == id, FolderModel.user_id == current_user.id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    update_data = folder_in.model_dump(exclude_unset=True)
    for field in update_data:
        setattr(folder, field, update_data[field])
        
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return folder
