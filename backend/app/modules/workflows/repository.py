from sqlalchemy.orm import Session
from app.modules.workflows.model import Workflow
from app.modules.workflows.schema import WorkflowCreate, WorkflowUpdate
from sqlalchemy.dialects.postgresql import insert

class WorkflowRepository:

    def get(self, db: Session, workflow_id: str):
        return db.query(Workflow).filter(Workflow.id == workflow_id).first()

    def list(self, db: Session, skip: int = 0, limit: int = 100):
        return db.query(Workflow).offset(skip).limit(limit).all()

    def create(self, db: Session, workflow: WorkflowCreate):
        db_workflow = Workflow(**workflow.model_dump())
        db.add(db_workflow)
        db.commit()
        db.refresh(db_workflow)
        return db_workflow

    def delete(self, db: Session, workflow_id: str):
        workflow = self.get(db, workflow_id)
        if workflow:
            db.delete(workflow)
            db.commit()
        return workflow
    
    def upsert(self, db:Session, workflow_payload: WorkflowUpdate):
        insert_stmt = insert(Workflow).values(
            id=workflow_payload.id,
            nodes=workflow_payload.nodes,
            edges=workflow_payload.edges,
            user_id= workflow_payload.user_id
        )   

        upsert_stmt=insert_stmt.on_conflict_do_update(
            index_elements=['id'],            
            set_={
                'nodes':insert_stmt.excluded.nodes,
                'edges': insert_stmt.excluded.edges
            }
        )
        
        db.execute(upsert_stmt)
        db.commit()
    
workflow_action = WorkflowRepository()
