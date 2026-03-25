from sqlalchemy.orm import Session
from .model import Execution, Webhook, FormConfig

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
    
    def find_webhook(self, db:Session, webhook_id:str):
        webhook = db.query(Webhook).filter_by(id=webhook_id).first()
        return webhook
    
    def save_form_config(self, db: Session, workflow_id: str, node_id: str, 
                         form_elements: list[str], form_title: str, 
                         form_description: str, account_name: str) -> FormConfig:
        form = db.query(FormConfig).filter_by(
            workflow_id=workflow_id, node_id=node_id
        ).first()

        if form:
            form.form_elements = form_elements
            form.form_title = form_title
            form.form_description = form_description
        else:
            form = FormConfig(
                workflow_id=workflow_id,
                node_id=node_id,
                form_elements=form_elements,
                form_title=form_title,
                form_description=form_description,
                accountName=account_name
            )
            db.add(form)

        db.commit()
        db.refresh(form)
        return form

    def get_form_config(self, db: Session, form_id: str) -> FormConfig | None:
        return db.query(FormConfig).filter_by(id=form_id).first()
    
    def get_user_executions(self, db: Session, user_id: str):
        from app.modules.workflows.model import Workflow
        return db.query(Execution).join(Workflow).filter(
            Workflow.user_id == user_id
        ).order_by(Execution.createdAt.desc()).limit(100).all()