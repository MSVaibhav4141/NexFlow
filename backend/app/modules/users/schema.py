from pydantic import BaseModel,ConfigDict
from typing import Optional
class UserBase(BaseModel):
    name: str
    model_config = ConfigDict(from_attributes=True)

class UserCreate(UserBase):
    email:str
    password:str
    accountName:str


class UserResposne(UserBase):
    id:str
    email:str
    accountName:str
    encoded: Optional[str] = None
    
class UserAvailabilityResponse(BaseModel):
    is_user: bool

class UserLoginRequest(BaseModel):
    email:str
    password:str