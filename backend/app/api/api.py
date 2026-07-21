from fastapi import APIRouter
from app.api.endpoints import auth, users, folders, decks, vocabularies, import_data, study

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(folders.router, prefix="/folders", tags=["folders"])
api_router.include_router(decks.router, prefix="/decks", tags=["decks"])
api_router.include_router(vocabularies.router, prefix="/vocabularies", tags=["vocabularies"])
api_router.include_router(import_data.router, prefix="/import", tags=["import"])
api_router.include_router(study.router, prefix="/study", tags=["study"])
