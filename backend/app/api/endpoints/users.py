from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.user import User, UserUpdate
from app.models.user import User as UserModel
from app.core import security
from pydantic import BaseModel

router = APIRouter()

@router.get("/me", response_model=User)
def read_user_me(
    current_user: UserModel = Depends(deps.get_current_user),
):
    """
    Get current user.
    """
    return current_user

@router.put("/me", response_model=User)
def update_user_me(
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserUpdate,
    current_user: UserModel = Depends(deps.get_current_user),
):
    """
    Update own user.
    """
    update_data = user_in.model_dump(exclude_unset=True)
    if "password" in update_data:
        del update_data["password"]
        
    for field in update_data:
        setattr(current_user, field, update_data[field])
        
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user

class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str

@router.put("/me/password")
def update_password_me(
    *,
    db: Session = Depends(deps.get_db),
    password_in: PasswordUpdate,
    current_user: UserModel = Depends(deps.get_current_user),
):
    """
    Update own password.
    """
    if not security.verify_password(password_in.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect password")
        
    current_user.hashed_password = security.get_password_hash(password_in.new_password)
    db.add(current_user)
    db.commit()
    return {"msg": "Password updated successfully"}
