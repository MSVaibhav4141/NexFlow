from pydantic import BaseModel
from typing import Any

class CredentialCreate(BaseModel):
    name: str
    service: str
    data: dict[str, Any]

class CredentialResponse(BaseModel):
    id: str
    name: str
    service: str

class CredentialDetailResponse(BaseModel):
    id: str
    name: str
    service: str
    data: dict[str, Any]