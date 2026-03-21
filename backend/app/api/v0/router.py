from fastapi import APIRouter
from app.modules.workflows.router import router as workflow_router
from app.modules.users.routes import router as user_router
from app.modules.execution.routes import router as execution_router

api_router = APIRouter()

api_router.include_router(workflow_router)
api_router.include_router(user_router)
api_router.include_router(execution_router)
