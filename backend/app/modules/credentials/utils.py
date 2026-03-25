from app.db.db import SessionLocal
from app.modules.credentials.repositary import CredentialRepository
from typing import Any

def get_credential_data(credential_id: str) -> dict[str,Any]:
    db = SessionLocal()
    try:
        repo = CredentialRepository()
        cred = repo.get_by_id_only(db=db, credential_id=credential_id)
        if not cred:
            return {}
        return cred.data
    finally:
        db.close()