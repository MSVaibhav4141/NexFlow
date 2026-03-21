from fastapi import APIRouter
from .schema import UserCreate, UserResposne, UserAvailabilityResponse, UserLoginRequest
from .services import UserService
from fastapi import Depends, status
from sqlalchemy.orm import Session
from app.db.db import get_db
from pydantic import EmailStr
from .dependency import user_service


router = APIRouter(prefix='/user',tags=["User"])

@router.post("/register", response_model=UserResposne, status_code=status.HTTP_201_CREATED)
def create_valid_user(user_payload: UserCreate,
                      db:Session = Depends(get_db),
                      service: UserService = Depends(user_service)):
    user = service.create_user(db=db, user_payload=user_payload)
    return user

@router.post("/login", response_model=UserResposne)
def user_login(login_payload: UserLoginRequest, 
               service:UserService = Depends(user_service), 
               db:Session = Depends(get_db)):
    print(login_payload)
    user = service.user_login(db=db, login_payload=login_payload)
    return user 
    

@router.get("/user/{email}", response_model=UserAvailabilityResponse)
def get_by_email(email: EmailStr,
                 service: UserService = Depends(user_service),
                 db:Session = Depends(get_db)):
    result = service.get_user_email(db=db, email=email)
    return result