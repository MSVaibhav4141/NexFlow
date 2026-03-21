from fastapi import APIRouter,Depends
from app.db.db import get_db
from sqlalchemy.orm import Session
from app.modules.workflows.repository import workflow_action
from app.modules.workflows.schema import WorkflowResponse, WorkflowUpdate, WorkflowUpdateMessage
from app.modules.workflows.dependency import workflow_service
from .services import WorkflowServices

router = APIRouter(prefix="/workflows", tags=["Workflows"])

@router.get("/", response_model=list[WorkflowResponse])
def get_workflows(db:Session = Depends(get_db)):
    workflows = workflow_action.list(db=db) 
    return  workflows

@router.put("/workflow", response_model=WorkflowUpdateMessage)
def upsert_workflow(workflow_payload:WorkflowUpdate,
                    db:Session = Depends(get_db),
                    service:WorkflowServices = Depends(workflow_service)):
    response = service.update_workflow(db=db, workflow_payload=workflow_payload)
    return response

@router.get("/wokflow/{id}", response_model=WorkflowResponse)
def get_workflow(id:str,
                db:Session = Depends(get_db),
                service:WorkflowServices = Depends(workflow_service)):
    workflow = service.get_by_id(db=db, wokflow_id=id) 
    return  workflow
