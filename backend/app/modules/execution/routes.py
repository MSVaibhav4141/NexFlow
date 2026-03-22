from fastapi import WebSocket, WebSocketDisconnect,APIRouter, Depends, BackgroundTasks,HTTPException
from .websocket import ws_manager
from sqlalchemy.orm import Session
from app.db.db import get_db
from .schema import ExecutionStartRequest, ExecutionResponse
from .service import ExecutionService
from .model import Execution
from .dependency import get_service
from fastapi.responses import HTMLResponse
router = APIRouter(prefix='/execution',tags=["Execution"])

# ... your existing @router.post("/start") route goes here ...

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