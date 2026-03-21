from sqlalchemy.orm import Session
from .model import Execution

class ExecutionRepository:

    def create_execution(self,db:Session, workflow_id:str):
        execution = Execution(workflow_id=workflow_id)
        db.add(execution)
        db.commit()
        db.refresh(execution)
        return execution
    
    def get_execution(self, db:Session, execution_id:str):
        execution = db.query(Execution).filter(Execution.id == execution_id).first()

        return execution