from pydantic import BaseModel, ConfigDict
from typing import Any
class FormElementSchema(BaseModel):
    label: str
    type: str

class FormConfigResponse(BaseModel):
    form_id: str
    form_title: str | None
    form_description: str | None
    form_elements: list[dict[str, Any]]

class FormSaveRequest(BaseModel):
    workflow_id: str
    node_id: str
    form_title: str | None = None
    form_description: str | None = None
    form_elements: list[Any] = []
class FormSaveResponse(BaseModel):
    form_id: str
    url: str
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

class WebhookSaveRequest(BaseModel):
    workflow_id: str
    node_id: str
    method: str = "POST"
class WebhookResponse(BaseModel):
    message: str
    webhook_id: str
    method: str 
    url:str
 