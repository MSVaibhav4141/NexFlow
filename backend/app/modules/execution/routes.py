from fastapi import WebSocket, WebSocketDisconnect,APIRouter, Depends, BackgroundTasks,HTTPException,Request
from .websocket import ws_manager
from sqlalchemy.orm import Session
from app.db.db import get_db
from .schema import FormSaveResponse,FormConfigResponse,FormSaveRequest,ExecutionStartRequest, ExecutionResponse,WebhookSaveRequest, WebhookResponse
from .service import ExecutionService
from .model import Execution,Webhook
from app.modules.users.model import User
from .dependency import get_service
from fastapi.responses import HTMLResponse
from app.dependency import validate_token
router = APIRouter(prefix='/execution',tags=["Execution"])


@router.post("/start", response_model=ExecutionResponse,)
async def start_execution(
    payload: ExecutionStartRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    service: ExecutionService = Depends(get_service)
):
    # 1. Create the blank execution record in the database
    execution = service.create_execution(db=db, workflow_id=payload.workflow_id)

    # 2. Tell FastAPI to run the heavy engine logic in the background
    background_tasks.add_task(
        service.run_execution ,
        execution_id=execution.id, 
        workflow_id=payload.workflow_id,
        trigger_node=payload.trigger_node_id,
        trigger_data=payload.trigger_data
    )

    # 3. Immediately respond to Next.js with the ID
    return ExecutionResponse(
        execution_id=execution.id,
        status="running",
        message="Execution started in the background"
    )

@router.websocket("/ws/{execution_id}")
async def execution_websocket_endpoint(websocket: WebSocket, execution_id: str):
    # 1. Connect the user
    await ws_manager.connect(websocket, execution_id)
    try:
        # 2. Keep the connection open
        while True:
            # We don't expect the frontend to send us much, 
            # but we need this loop to keep the line open.
             await websocket.receive_text()
    except WebSocketDisconnect:
        # 3. Clean up if the user closes their browser
        ws_manager.disconnect(websocket, execution_id)

@router.get("/")
def get_executions(
    db: Session = Depends(get_db),
    user_id: str = Depends(validate_token),
    service: ExecutionService = Depends(get_service)
):
    executions = service.list_user_executions(db=db, user_id=user_id)
    return executions

@router.websocket("/ws/workflow/{workflow_id}")
async def workflow_websocket_endpoint(websocket: WebSocket, workflow_id: str):
    await ws_manager.connect_workflow(websocket, workflow_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect_workflow(websocket, workflow_id)

@router.get("/resume")
async def resume_workflow_webhook(\
    execution_id: str, 
    node_id: str, 
    action: str, 
    background_tasks: BackgroundTasks,
    service: ExecutionService = Depends(get_service),
    db: Session = Depends(get_db)
):
    # 1. Find the paused execution
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
        
    if execution.status != 'paused':
        return HTMLResponse(content="<h1>Workflow is not paused!</h1><p>It may have already been resumed or completed.</p>")

    # 2. Update the state with the user's action
    state = execution.state or {}
    
    node_data = state.get(node_id, {})
    node_data.update({
        "status": "success", 
        "user_action": action, # This will be "approved" or "rejected"
        "human_responded": True
    })
    # We simulate a "Success" output from the node, but inject the user's choice
    state[node_id] = {
        "status": "success", 
        "user_action": action, # "approved" or "rejected"
        "message": f"Human responded with: {action}"
    }
    
    execution.state = state
    execution.status = 'running'
    db.commit()

    # 3. Wake the engine back up in the background!
    # We don't want the user's browser to hang while the rest of the workflow finishes.
    background_tasks.add_task(
        service.resume_execution, 
        workflow_id=execution.workflow_id,
        execution_id=execution_id,
        resumed_node_id=node_id
    )

    # 4. Return a nice HTML page to the user
    color = "#22c55e" if action == "approved" else "#ef4444"
    html_content = f"""
    <html>
        <body style="font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f3f4f6;">
            <div style="text-align: center; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h1 style="color: {color};">Action Recorded: {action.capitalize()}!</h1>
                <p>The workflow has been resumed. You can safely close this tab.</p>
            </div>
        </body>
    </html>
    """
    return HTMLResponse(content=html_content)

@router.post("/config", response_model=WebhookResponse)
async def save_webhook_config(
    payload: WebhookSaveRequest,
    db: Session = Depends(get_db),
    user: str = Depends(validate_token)
):  
    tenant_id = db.query(User.accountName).filter_by(id=user).scalar()
    print(f"{tenant_id}balle balleabalee")
    if not tenant_id:
        raise HTTPException(status_code=404, detail="Invalid Request")
    
    webhook = db.query(Webhook).filter_by(
        workflow_id=payload.workflow_id,
        node_id=payload.node_id
    ).first()

    if webhook:
        webhook.method = payload.method
    else:
        webhook = Webhook(
            workflow_id=payload.workflow_id,
            node_id=payload.node_id,
            method=payload.method,
            accountName=tenant_id
        )
        db.add(webhook)

    db.commit()
    db.refresh(webhook)

    frontend_domain = f"https://{tenant_id}.nexflow.vaibhavr.xyz"
    full_webhook_url = f"{frontend_domain}/api/webhook/{webhook.id}"

    return {
        "message": "Webhook saved successfully",
        "webhook_id": webhook.id,
        "method": webhook.method,
        "url": full_webhook_url
    }

@router.post("/{webhook_id}")
async def trigger_webhook_post(
    webhook_id: str, 
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    service: ExecutionService = Depends(get_service)
):
    return await service.run_webhook(
        db=db, 
        webhook_id=webhook_id, 
        request=request, 
        background_tasks=background_tasks
    )

@router.get("/{webhook_id}")
async def trigger_webhook_get(
    webhook_id: str, 
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    service: ExecutionService = Depends(get_service)
):
    return await service.run_webhook(
        db=db, 
        webhook_id=webhook_id, 
        request=request, 
        background_tasks=background_tasks
    )

@router.post("/form/config", response_model=FormSaveResponse)
async def save_form_config(
    payload: FormSaveRequest,
    db: Session = Depends(get_db),
    user: str = Depends(validate_token),
    service: ExecutionService = Depends(get_service)
):
    result = await service.save_form(
        db=db,
        workflow_id=payload.workflow_id,
        node_id=payload.node_id,
        form_elements=payload.form_elements,
        form_title=payload.form_title if payload.form_title else "Title",
        form_description=payload.form_description if payload.form_description else "Title",
        user_id=user
    )
    return result

@router.get("/form/{form_id}", response_model=FormConfigResponse)
async def get_form_schema(
    form_id: str,
    db: Session = Depends(get_db),
    service: ExecutionService = Depends(get_service)
):
    form = service.repo.get_form_config(db=db, form_id=form_id)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    return FormConfigResponse(
        form_id=form.id,
        form_title=form.form_title,
        form_description=form.form_description,
        form_elements=form.form_elements or []
    )
@router.post("/form/{form_id}/submit")
async def submit_form(
    form_id: str,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    service: ExecutionService = Depends(get_service)
):
    body = await request.json()
    return await service.submit_form(
        db=db,
        form_id=form_id,
        field_values=body,
        background_tasks=background_tasks
    )