from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.api import deps
from app.schemas.deck import Deck, DeckCreate, DeckUpdate
from app.models.deck import Deck as DeckModel
from app.models.folder import Folder as FolderModel
from app.models.user import User

router = APIRouter()

@router.get("/folder/{folder_id}", response_model=List[Deck])
def read_decks_by_folder(
    *,
    db: Session = Depends(deps.get_db),
    folder_id: int,
    current_user: User = Depends(deps.get_current_user)
):
    folder = db.query(FolderModel).filter(FolderModel.id == folder_id, FolderModel.user_id == current_user.id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    decks = db.query(DeckModel).filter(DeckModel.folder_id == folder_id).all()
    
    # Calculate learned_words for each deck
    from app.models.vocabulary import Vocabulary
    from app.models.study_progress import StudyProgress
    for d in decks:
        learned = db.query(Vocabulary).join(StudyProgress).filter(
            Vocabulary.deck_id == d.id,
            StudyProgress.level >= 4
        ).count()
        d.learned_words = learned
        
    return decks

@router.post("/folder/{folder_id}", response_model=Deck)
def create_deck(
    *,
    db: Session = Depends(deps.get_db),
    folder_id: int,
    deck_in: DeckCreate,
    current_user: User = Depends(deps.get_current_user)
):
    folder = db.query(FolderModel).filter(FolderModel.id == folder_id, FolderModel.user_id == current_user.id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    deck = DeckModel(
        title=deck_in.title,
        description=deck_in.description,
        cover_image=deck_in.cover_image,
        folder_id=folder_id
    )
    db.add(deck)
    db.commit()
    db.refresh(deck)
    return deck

@router.delete("/{id}", response_model=Deck)
def delete_deck(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_user)
):
    # Check ownership by joining with Folder
    deck = db.query(DeckModel).join(FolderModel).filter(DeckModel.id == id, FolderModel.user_id == current_user.id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    
    db.delete(deck)
    db.commit()
    return deck

@router.get("/{id}", response_model=Deck)
def read_deck(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_user)
):
    deck = db.query(DeckModel).join(FolderModel).filter(DeckModel.id == id, FolderModel.user_id == current_user.id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    return deck

@router.put("/{id}", response_model=Deck)
def update_deck(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    deck_in: DeckUpdate,
    current_user: User = Depends(deps.get_current_user)
):
    deck = db.query(DeckModel).join(FolderModel).filter(DeckModel.id == id, FolderModel.user_id == current_user.id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    
    update_data = deck_in.model_dump(exclude_unset=True)
    for field in update_data:
        setattr(deck, field, update_data[field])
        
    db.add(deck)
    db.commit()
    db.refresh(deck)
    return deck
