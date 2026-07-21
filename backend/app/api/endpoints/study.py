from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import datetime
import random
from app.api import deps
from app.models.study_progress import StudyProgress
from app.models.vocabulary import Vocabulary
from app.models.deck import Deck
from app.models.learning_session import LearningSession
from app.models.user import User as UserModel
from pydantic import BaseModel
from app.schemas.vocabulary import Vocabulary as VocabSchema
from app.schemas.study_progress import StudyProgress as ProgressSchema

router = APIRouter()

class ReviewSubmit(BaseModel):
    is_correct: bool
    study_time_seconds: int = 0

class VocabularyWithProgress(VocabSchema):
    study_progress: Optional[ProgressSchema] = None

@router.get("/due/{deck_id}", response_model=List[VocabularyWithProgress])
def get_due_vocabularies(
    *,
    db: Session = Depends(deps.get_db),
    deck_id: int,
    current_user: UserModel = Depends(deps.get_current_user)
):
    """
    Get all vocabularies in a deck, along with their study progress for the current user.
    The frontend will use this to build the SRS queue (level < 4) or shuffle for Survival mode.
    """
    # Verify deck exists
    deck = db.query(Deck).filter(Deck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
        
    vocabs = db.query(Vocabulary).filter(Vocabulary.deck_id == deck_id).all()
    
    # Get all study progress for this user and these vocabs
    vocab_ids = [v.id for v in vocabs]
    progresses = db.query(StudyProgress).filter(
        StudyProgress.user_id == current_user.id,
        StudyProgress.vocab_id.in_(vocab_ids) if vocab_ids else []
    ).all()
    
    progress_map = {p.vocab_id: p for p in progresses}
    
    results = []
    for v in vocabs:
        v_dict = v.__dict__.copy()
        if v.id in progress_map:
            v_dict["study_progress"] = progress_map[v.id]
        else:
            # Provide default progress
            v_dict["study_progress"] = {
                "id": 0,
                "user_id": current_user.id,
                "vocab_id": v.id,
                "level": 0,
                "step_corrects": 0,
                "target_corrects": 1,
                "correct_count": 0,
                "wrong_count": 0,
                "last_reviewed_at": None
            }
        results.append(v_dict)
        
    return results

@router.post("/{vocab_id}/review")
def submit_review(
    *,
    db: Session = Depends(deps.get_db),
    vocab_id: int,
    review_in: ReviewSubmit,
    current_user: UserModel = Depends(deps.get_current_user)
):
    """
    Submit a review (correct/wrong) for a vocabulary to update the 4-level SRS system.
    """
    vocab = db.query(Vocabulary).filter(Vocabulary.id == vocab_id).first()
    if not vocab:
        raise HTTPException(status_code=404, detail="Vocabulary not found")
        
    # Update or Create StudyProgress
    progress = db.query(StudyProgress).filter(
        StudyProgress.user_id == current_user.id,
        StudyProgress.vocab_id == vocab_id
    ).first()
    
    is_new = False
    if not progress:
        is_new = True
        progress = StudyProgress(
            user_id=current_user.id,
            vocab_id=vocab_id,
            level=0,
            step_corrects=0,
            target_corrects=1,
            correct_count=0,
            wrong_count=0
        )
        db.add(progress)
        
    # Implement 4-level SRS logic
    if review_in.is_correct:
        progress.correct_count += 1
        if progress.level == 0:
            progress.level = 1
            progress.step_corrects = 0
            progress.target_corrects = 1
        else:
            progress.step_corrects += 1
            if progress.step_corrects >= progress.target_corrects:
                if progress.level < 4:
                    progress.level += 1
                progress.step_corrects = 0
                progress.target_corrects = 1
    else:
        progress.wrong_count += 1
        # In this SRS, wrong answers don't decrement level, they just delay graduation
        # Optionally we could reset step_corrects to 0 here if desired.
        progress.step_corrects = 0
        
    progress.last_reviewed_at = datetime.datetime.utcnow()
    
    # Update LearningSession for today
    today = datetime.datetime.utcnow().date()
    session = db.query(LearningSession).filter(
        LearningSession.user_id == current_user.id,
        LearningSession.date == today
    ).first()
    
    if not session:
        session = LearningSession(
            user_id=current_user.id, 
            date=today,
            words_studied=0,
            words_reviewed=0,
            correct_count=0,
            wrong_count=0,
            study_time_seconds=0
        )
        db.add(session)
        
    session.words_reviewed += 1
    if is_new:
        session.words_studied += 1
        
    if review_in.is_correct:
        session.correct_count += 1
    else:
        session.wrong_count += 1
        
    session.study_time_seconds += review_in.study_time_seconds
    
    # Update user streak if necessary
    if current_user.last_study_date:
        last_study_date_only = current_user.last_study_date.date()
    else:
        last_study_date_only = None
        
    if last_study_date_only != today:
        if last_study_date_only == today - datetime.timedelta(days=1):
            current_user.current_streak += 1
        elif not last_study_date_only or last_study_date_only < today - datetime.timedelta(days=1):
            current_user.current_streak = 1
        current_user.last_study_date = datetime.datetime.utcnow()
        db.add(current_user)
        
    db.commit()
    db.refresh(progress)
    
    return {"msg": "Review submitted successfully", "level": progress.level}
