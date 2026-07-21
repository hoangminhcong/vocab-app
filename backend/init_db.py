from app.db.database import engine, Base
# Import all models so they are registered with Base
from app.models.user import User
from app.models.folder import Folder
from app.models.deck import Deck
from app.models.vocabulary import Vocabulary
from app.models.learning_session import LearningSession
from app.models.study_progress import StudyProgress

print("Creating tables in Supabase...")
try:
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully!")
except Exception as e:
    print("ERROR:", str(e))
