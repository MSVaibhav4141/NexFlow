from .repository import WorkflowRepository
from sqlalchemy.orm import Session
from .schema import WorkflowUpdate, WorkflowUpdateMessage
from fastapi import HTTPException, status

class WorkflowServices:
    def __init__(self, repo:WorkflowRepository) -> None:
        self.repo = repo
    
    def update_workflow(self, db:Session, workflow_payload:WorkflowUpdate):    
        self.repo.upsert(db=db, workflow_payload=workflow_payload)
        return WorkflowUpdateMessage(success=True, mssg="Workflow Successfully Saved")

    def get_by_id(self, db:Session, wokflow_id:str):
        workflow = self.repo.get(db=db, workflow_id=wokflow_id)

        if not workflow:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail="Workflow not found")
        return workflow