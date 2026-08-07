from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.api import deps
from app.schemas.deck import Deck, DeckCreate, DeckUpdate
from app.models.deck import Deck as DeckModel
from app.models.folder import Folder as FolderModel
from app.models.user import User
from app.models.missed_watering import MissedWateringLog

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

@router.get("/withered", response_model=List[Deck])
def get_withered_decks(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    import datetime
    now = datetime.datetime.now(datetime.timezone.utc)
    
    # Query decks that have next_wither_at in the past, belonging to the current user
    decks = db.query(DeckModel).join(FolderModel).filter(
        FolderModel.user_id == current_user.id,
        DeckModel.next_wither_at != None,
        DeckModel.next_wither_at < now
    ).all()
    
    # Auto-record missed waterings
    vn_tz = datetime.timezone(datetime.timedelta(hours=7))
    now_vn = now.astimezone(vn_tz)
    
    for deck in decks:
        wither_date = deck.next_wither_at.astimezone(vn_tz).date()
        # If the day it withered is strictly before today in VN time, it's a missed watering
        if wither_date < now_vn.date():
            # Check if we already logged this missed day for this deck
            existing_log = db.query(MissedWateringLog).filter(
                MissedWateringLog.user_id == current_user.id,
                MissedWateringLog.deck_id == deck.id,
                MissedWateringLog.date == wither_date
            ).first()
            
            if not existing_log:
                new_log = MissedWateringLog(
                    user_id=current_user.id,
                    deck_id=deck.id,
                    deck_title=deck.title,
                    date=wither_date
                )
                db.add(new_log)
    db.commit()
    
    # Calculate learned_words for each deck so response model doesn't complain
    from app.models.vocabulary import Vocabulary
    from app.models.study_progress import StudyProgress
    for d in decks:
        learned = db.query(Vocabulary).join(StudyProgress).filter(
            Vocabulary.deck_id == d.id,
            StudyProgress.level >= 4
        ).count()
        d.learned_words = learned
        
    return decks

@router.get("/missed-waterings")
def get_missed_waterings(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    # Fetch all missed waterings for user
    logs = db.query(MissedWateringLog).filter(
        MissedWateringLog.user_id == current_user.id
    ).order_by(MissedWateringLog.date.desc()).all()
    
    # Group by date
    grouped = {}
    for log in logs:
        date_str = log.date.isoformat()
        if date_str not in grouped:
            grouped[date_str] = []
        grouped[date_str].append({
            "id": log.id,
            "deck_id": log.deck_id,
            "deck_title": log.deck_title
        })
        
    result = []
    for date_str, items in grouped.items():
        result.append({
            "date": date_str,
            "decks": items
        })
        
    return result

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

@router.post("/{id}/survival-win", response_model=Deck)
def record_survival_win(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_user)
):
    import datetime
    from app.models.vocabulary import Vocabulary
    from app.models.study_progress import StudyProgress
    
    deck = db.query(DeckModel).join(FolderModel).filter(DeckModel.id == id, FolderModel.user_id == current_user.id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
        
    now = datetime.datetime.now(datetime.timezone.utc)
    deck.last_reviewed_at = now
    
    learned = db.query(Vocabulary).join(StudyProgress).filter(
        Vocabulary.deck_id == id,
        StudyProgress.level >= 4
    ).count()

    # Only progress flower if SRS is 100% complete
    if deck.total_words > 0 and learned >= deck.total_words:
        # Increase wins
        deck.survival_wins += 1
        
        # Stage 0: Initial budding phase (needs 2 wins to bloom)
        if deck.wither_stage == 0:
            if deck.survival_wins >= 2:
                deck.wither_stage = 1
                deck.next_wither_at = now + datetime.timedelta(days=1)
        # Stages 1+: Withered phases
        else:
            # Check if it was actually withered
            # If next_wither_at is in the past, they successfully rescued the flower
            if deck.next_wither_at and now >= deck.next_wither_at:
                deck.wither_stage = 2
                
                # Calculate 7 AM on the 3rd day in Vietnam Time (UTC+7)
                vn_tz = datetime.timezone(datetime.timedelta(hours=7))
                now_vn = now.astimezone(vn_tz)
                next_date_vn = now_vn + datetime.timedelta(days=3)
                next_wither_vn = next_date_vn.replace(hour=7, minute=0, second=0, microsecond=0)
                
                deck.next_wither_at = next_wither_vn
    
    db.add(deck)
    db.commit()
    db.refresh(deck)
    
    # Manually attach learned_words so response_model works
    deck.learned_words = learned
    
    return deck
