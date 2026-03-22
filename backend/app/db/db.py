from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from ..config import settings

DB_URL = settings.DB_URL
print(DB_URL)

engine = create_engine(url=DB_URL)

SessionLocal = sessionmaker(autoflush=False, autocommit=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

