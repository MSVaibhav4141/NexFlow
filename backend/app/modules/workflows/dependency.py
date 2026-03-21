from .repository import WorkflowRepository
from .services import WorkflowServices
from fastapi import Depends

def get_repo():
    return WorkflowRepository()

def workflow_service(repo:WorkflowRepository = Depends(get_repo)):
    return WorkflowServices(repo=repo)