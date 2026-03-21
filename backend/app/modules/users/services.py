from .repository import UserRepository
from .schema import UserCreate, UserAvailabilityResponse, UserLoginRequest
from sqlalchemy.orm import Session
from .model import User
from pydantic import EmailStr
from passlib.hash import pbkdf2_sha256
from fastapi import HTTPException, status

class UserService:
    def __init__(self, repo: UserRepository):
        self.repo = repo

    def create_user(self, db:Session , user_payload:UserCreate) -> User:
        user = self.repo.get_by_email(db=db, email=user_payload.email)

        if user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Email already registered in our system."
            )
        hashed_password = pbkdf2_sha256.hash(user_payload.password)
        user_payload.password = hashed_password


        user = self.repo.create(db=db, user=user_payload)
        return user
    
    def get_user_email(self, db:Session , email:EmailStr) -> UserAvailabilityResponse:
        user = self.repo.get_by_email(db=db, email=email)

        if user:
            return UserAvailabilityResponse(is_user=True)
        return UserAvailabilityResponse(is_user=False)

    def user_login(self, db:Session, login_payload:UserLoginRequest):
        user = self.repo.get_by_email(db=db, email=login_payload.email)

        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                                detail="Invalid Credentials")
        
        is_password_correct=pbkdf2_sha256.verify(login_payload.password,user.password)
            
        if not is_password_correct:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid Credentials")
        
        return user
