from .repository import ExecutionRepository
from .service import ExecutionService
from fastapi import Depends
def get_repo():
    return ExecutionRepository()

def get_service(repo:ExecutionRepository = Depends(get_repo)):
    return ExecutionService(repo=repo)