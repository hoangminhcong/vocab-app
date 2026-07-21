from app.db.database import SessionLocal
from app.models.user import User

try:
    db = SessionLocal()
    users = db.query(User).all()
    print("Number of users:", len(users))
    db.close()
except Exception as e:
    print("ERROR:", str(e))
