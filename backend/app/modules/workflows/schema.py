from pydantic import BaseModel, ConfigDict
from typing import Optional, Any

class WorkflowBase(BaseModel):
    id:str
    user_id:str
    model_config = ConfigDict(
        from_attributes=True,     
    )

class WorkflowCreate(WorkflowBase):
        nodes:list[dict[str,Any]]
        edges:Optional[list[dict[str,Any]]]

class WorkflowUpdate(WorkflowBase):
      nodes:Optional[list[dict[str,Any]]]
      edges:Optional[list[dict[str,Any]]]

class WorkflowResponse(WorkflowBase):
    nodes: Optional[list[dict[str,Any]]] = []
    edges: Optional[list[dict[str,Any]]] = []

class WorkflowUpdateMessage(BaseModel):
      success: bool
      mssg:str