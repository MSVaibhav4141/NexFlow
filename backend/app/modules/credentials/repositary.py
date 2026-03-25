from sqlalchemy.orm import Session
from .model import Credential
from typing import Any

class CredentialRepository:
    def create(self, db: Session, user_id: str, name: str, service: str, data: dict[str, Any]):
        cred = Credential(user_id=user_id, name=name, service=service, data=data)
        db.add(cred)
        db.commit()
        db.refresh(cred)
        return cred

    def list_by_service(self, db: Session, user_id: str, service: str):
        return db.query(Credential).filter_by(user_id=user_id, service=service).all()

    def get_by_id(self, db: Session, credential_id: str, user_id: str):
        return db.query(Credential).filter_by(id=credential_id, user_id=user_id).first()

    def delete(self, db: Session, credential_id: str, user_id: str):
        cred = db.query(Credential).filter_by(id=credential_id, user_id=user_id).first()
        if cred:
            db.delete(cred)
            db.commit()
        return cred
    
    def get_by_id_only(self, db: Session, credential_id: str):
        return db.query(Credential).filter_by(id=credential_id).first()