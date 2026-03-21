from sqlalchemy.orm import Session
from .model import User
from .schema import UserCreate

class UserRepository:
    def get(self, db:Session, user_id:str):    #THink of it why not db on __init__
        user = db.query(User).filter(User.id == user_id).first()
        return user
    
    def get_by_email(self, db:Session, email:str):    #THink of it why not db on __init__
        user = db.query(User).filter(User.email == email).first()
        return user

    def create(self, db:Session, user: UserCreate):
        new_user = User(**user.model_dump())
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
