# app/modules/credentials/routes.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.db import get_db
from app.dependency import validate_token
from .repositary import CredentialRepository
from .schema import CredentialCreate, CredentialResponse

router = APIRouter(prefix="/credentials", tags=["Credentials"])
repo = CredentialRepository()

@router.post("", response_model=CredentialResponse)
def create_credential(
    payload: CredentialCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(validate_token)
):
    cred = repo.create(
        db=db,
        user_id=user_id,
        name=payload.name,
        service=payload.service,
        data=payload.data
    )
    return CredentialResponse(id=cred.id, name=cred.name, service=cred.service)

@router.get("/{service}", response_model=list[CredentialResponse])
def list_credentials(
    service: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(validate_token)
):
    creds = repo.list_by_service(db=db, user_id=user_id, service=service)
    return [CredentialResponse(id=c.id, name=c.name, service=c.service) for c in creds]

@router.delete("/{credential_id}")
def delete_credential(
    credential_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(validate_token)
):
    cred = repo.delete(db=db, credential_id=credential_id, user_id=user_id)
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found")
    return {"deleted": credential_id}