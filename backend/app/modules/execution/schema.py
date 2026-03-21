from pydantic import BaseModel, ConfigDict
from typing import Any

class ExecutionBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

class ExecutionRequest(ExecutionBase):
    id: str
    workflow_id:str
    state: dict[str, Any]
    status: str

class ExecutionResponse(ExecutionBase):
    execution_id:str
    status:str
    message:str

class ExecutionStartRequest(BaseModel):
    workflow_id: str
    trigger_node_id: str
    trigger_data: dict[str, Any] = {}

