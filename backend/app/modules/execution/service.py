from .repository import ExecutionRepository
from app.modules.workflows.model import Workflow
from app.modules.execution.model import Execution
import traceback
from .registry import TASK_REGISTRY
from fastapi import HTTPException, Request, BackgroundTasks
from typing import Any
from .websocket import ws_manager
from sqlalchemy.orm import Session
import asyncio
class ExecutionService:

    def __init__(self,repo:ExecutionRepository):
        self.repo = repo

    def create_execution(self,db:Session, workflow_id:str):
        execution = self.repo.create_execution(db=db, workflow_id=workflow_id)
        return execution

    def list_user_executions(self, db: Session, user_id: str):
        return self.repo.get_user_executions(db=db, user_id=user_id)
    
    async def run_execution(self, workflow_id:str, execution_id:str, trigger_node:str, trigger_data:dict[str,str]):
        print("Running execution")
        from app.db.db import SessionLocal
        db = SessionLocal()

        try:
            execution = self.repo.get_execution(db=db, execution_id=execution_id)
            workflow  = db.query(Workflow).filter(Workflow.id == workflow_id).first() 

            global_state:dict[str,Any] = {}
            
            if not execution or not workflow:
                return
            
            account_name = workflow.user.accountName
            #creating adjacency list
            all_edges = workflow.edges
            connection:dict[str,list[dict[str,str]]] = {}

            for edge in all_edges:
                source = edge.get('source')   
                target = edge.get('target')
                handler = edge.get('sourceHandle',"")
                
                if not source or not target:
                    return
                
                if  source not in connection:
                    connection[source] = []
                
                edge_data = {"target": target, "handler": handler}
                if edge_data not in connection[source]:
                    connection[source].append(edge_data)
          
            global_state["__workflow_nodes"] = workflow.nodes
            global_state["__workflow_connections"] = connection
            global_state["execution_id"] = execution_id
            global_state["account_name"] = account_name
            print(all_edges)
            stack: list[str] = []
            if trigger_node in connection:
                for next_id in reversed(connection[trigger_node]):
                    stack.append(next_id["target"]) #

            global_state[trigger_node] = trigger_data
            print(connection, trigger_node)
            await ws_manager.broadcast(execution_id, {
                "type": "NODE_STARTED",
                "node_id": trigger_node
            })
            await asyncio.sleep(0.5)
            await ws_manager.broadcast(execution_id, {
                "type": "NODE_COMPLETED",
                "node_id": trigger_node,
                "status": "success",
                "output": trigger_data
            })
            cn=''
            
            TRIGGER_NODE_TYPES = {'manualTrigger', 'webhookTrigger', 'formTrigger'}

            visited_nodes: set[str] = set()

            for node in workflow.nodes:
                if node.get('type') in TRIGGER_NODE_TYPES:
                    visited_nodes.add(node['id'])
                    print(f"Pre-seeding trigger node: {node['id']} ({node.get('type')})")
            
            while stack:
                try:
                    current_node = stack.pop()
                    cn = current_node
                    
                    # Check for stop looping
                    if current_node in visited_nodes:
                        print(f"Cycle detected! Skipping {current_node} because it already ran.")
                        continue
                    
                    visited_nodes.add(current_node)

                    print(f"Processing node: {current_node}")

                    await ws_manager.broadcast(execution_id, {
                        "type": "NODE_STARTED",
                        "node_id": current_node
                    })

                    await asyncio.sleep(0.5)

                    current_node_data = next((n for n in workflow.nodes if n["id"] == current_node), None)
                    if not current_node_data:
                        continue
                    # execution
                    node_type = current_node_data.get("type","")
                    
                    
                    task_function = TASK_REGISTRY.get(node_type)
                    
                    if current_node_data['type'] == 'agentAi':
                        agent_connections = connection.get(current_node,[])
                        tool_node_ids = [edge["target"] for edge in agent_connections if edge["handler"] == "tool"]

                        tool_nodes = [n for n in workflow.nodes if n['id'] in tool_node_ids]

                        if "data" not in current_node_data:
                            current_node_data["data"] = {}
                        if "config" not in current_node_data["data"]: 
                            current_node_data["data"]["config"] = {}

                        current_node_data['execution_id'] = execution_id
                        current_node_data['tools'] = tool_nodes
                    if task_function:
                        import inspect
                        if inspect.iscoroutinefunction(task_function):
                            output = await task_function(current_node_data, global_state)
                        else:
                            output = task_function(current_node_data, global_state)
                    else:
                        output = {"status": "skipped", "message": f"No task registered for {node_type}"}
                    print(f"{output} yoyoyoyoyoyo")
                    status = output.get("status", "success")

                    global_state[current_node] = output
                    execution.state = global_state
                    execution.status = status
                    
                    if status == "failed":
                        execution.status = 'failed'
                        db.commit()
                        await ws_manager.broadcast(execution_id, {
                            "type": "NODE_COMPLETED",
                            "status": "failed",
                            "node_id": current_node,
                            "output": output
                        })
                        break 

                    if status == "paused":
                        execution.status = 'paused'
                        db.commit()
                        await ws_manager.broadcast(execution_id, {
                            "type": "NODE_COMPLETED",
                            "status": "paused",
                            "node_id": current_node,
                            "output": output
                        })
                        print(f"Node {current_node} paused execution. Going to sleep.")
                        return
                    
                 
                    db.commit() 
                    await ws_manager.broadcast(execution_id, {
                        "type": "NODE_COMPLETED",
                        "status": output.get("status", "success"),
                        "node_id": current_node,
                        "output": output
                    })
                    #updatedb
                    
                    is_conditional_node = output.get('branch')

                    next_nodes = connection.get(current_node, [])
                    for nodes in reversed(next_nodes):
                        handler = nodes.get('handler')
                        
                        if handler in ['tool', 'memory', 'chatModel']:
                            continue
                        if not is_conditional_node:
                            stack.append(nodes['target'])
                        elif is_conditional_node == nodes.get('handler'):
                            stack.append(nodes['target'])
                            

                except Exception as error:
                    print(f"Node {cn} stopped due to {error}")
                    execution.status = 'failed'
                    execution.state = global_state
                    db.commit()
                    await ws_manager.broadcast(execution_id, {
                        "type": "NODE_COMPLETED",
                        "status": "failed",
                        "node_id": cn,
                        "output": {"error": str(error)}
                    })
                    break
        except Exception:
            print(f"Engine crashed: {traceback.format_exc()}")
        finally:
            print("🧹 [RESUME] Closing Database Session.")
            db.close()
    
    async def resume_execution(self, workflow_id: str, execution_id: str, resumed_node_id: str):
        print(f"🚀 [RESUME] Starting resume sequence for Execution: {execution_id} | Node: {resumed_node_id}")
        import traceback
        from app.db.db import SessionLocal
        db = SessionLocal()

        try:
            print("🔍 [RESUME] Step 1: Fetching execution and workflow from DB...")
            execution = self.repo.get_execution(db=db, execution_id=execution_id)
            workflow  = db.query(Workflow).filter(Workflow.id == workflow_id).first()

            if not execution or not workflow:
                print(f" [RESUME ERROR] Aborting! Execution found: {execution is not None}, Workflow found: {workflow is not None}")
                return

            print(" [RESUME] Step 2: Rebuilding Graph Connections...")
            connection: dict[str, list[dict[str, str]]] = {}
            for edge in workflow.edges:
                source = edge.get('source')   
                target = edge.get('target')
                handler = edge.get('sourceHandle', "")
                if source and target:
                    if source not in connection:
                        connection[source] = []
                    edge_data = {"target": target, "handler": handler}
                    if edge_data not in connection[source]:
                        connection[source].append(edge_data)

            print("[RESUME] Step 3: Loading state and broadcasting success to UI...")
            global_state = execution.state or {}
            global_state["__workflow_nodes"] = workflow.nodes
            global_state["__workflow_connections"] = connection
            global_state["execution_id"] = execution_id
            
            output_data = global_state.get(resumed_node_id, {})
            await ws_manager.broadcast(execution_id, {
                "type": "NODE_COMPLETED",
                "node_id": resumed_node_id,
                "status": "success",
                "output": output_data
            })
            await asyncio.sleep(0.5)

            print("[RESUME] Step 4: Calculating Next Nodes (Evaluating Branching)...")
            stack: list[str] = []
            
            user_action = output_data.get("user_action") 
            if user_action: 
                is_conditional_node = "true" if user_action == "approved" else "false"
                print(f"   -> Human action '{user_action}' mapped to branch handler '{is_conditional_node}'")
            else:
                is_conditional_node = output_data.get('branch')
            
            next_nodes = connection.get(resumed_node_id, [])
            for nodes in reversed(next_nodes):
                handler = nodes.get('handler')
                if handler in ['tool', 'memory', 'chatModel']:
                    continue
                if not is_conditional_node:
                    stack.append(nodes['target'])
                elif is_conditional_node == nodes.get('handler'):
                    stack.append(nodes['target'])

            if not stack:
                print(" [RESUME] No next nodes found. Marking workflow as COMPLETED!")
                execution.status = "completed"
                db.commit()
                return

            print(f" [RESUME] Step 5: Entering Engine Loop with stack: {stack}")
            cn = ""
            TRIGGER_NODE_TYPES = {'manualTrigger', 'webhookTrigger', 'formTrigger'}
            visited_nodes: set[str] = set()

            for node in workflow.nodes:
                if node.get('type') in TRIGGER_NODE_TYPES:
                    visited_nodes.add(node['id'])
            while stack:
                try:
                    current_node = stack.pop()
                    cn = current_node
                    print(f" [RESUME] Processing node: {current_node}")

                    await ws_manager.broadcast(execution_id, {
                        "type": "NODE_STARTED",
                        "node_id": current_node
                    })
                    await asyncio.sleep(0.5)

                    current_node_data = next((n for n in workflow.nodes if n["id"] == current_node), None)
                    if not current_node_data:
                        print(f" [RESUME] Node {current_node} data not found in workflow. Skipping.")
                        continue
                        
                    node_type = current_node_data.get("type","")
                    task_function = TASK_REGISTRY.get(node_type)
                    
                    if current_node_data['type'] == 'agentAi':
                        agent_connections = connection.get(current_node,[])
                        tool_node_ids = [edge["target"] for edge in agent_connections if edge["handler"] == "tool"]
                        tool_nodes = [n for n in workflow.nodes if n['id'] in tool_node_ids]

                        if "data" not in current_node_data:
                            current_node_data["data"] = {}
                        if "config" not in current_node_data["data"]: 
                            current_node_data["data"]["config"] = {}

                        current_node_data['execution_id'] = execution_id
                        current_node_data['tools'] = tool_nodes
                        
                    if task_function:
                        import inspect
                        if inspect.iscoroutinefunction(task_function):
                            output = await task_function(current_node_data, global_state)
                        else:
                            output = task_function(current_node_data, global_state)
                    else:
                        output = {"status": "skipped", "message": f"No task registered for {node_type}"}

                    status = output.get("status", "success")
                    print(f"   -> Node {current_node} finished with status: {status}")

                    global_state[current_node] = output
                    execution.state = global_state
                    
                    if status == "failed":
                        print(f" [RESUME] Node {current_node} failed. Halting workflow.")
                        execution.status = 'failed'
                        db.commit()
                        await ws_manager.broadcast(execution_id, {
                            "type": "NODE_COMPLETED",
                            "status": "failed",
                            "node_id": current_node,
                            "output": output
                        })
                        break
                        
                    if status == "paused":
                        print(f" [RESUME] Node {current_node} requested pause. Saving state and sleeping.")
                        execution.status = 'paused'
                        db.commit()
                        await ws_manager.broadcast(execution_id, {
                            "type": "NODE_COMPLETED",
                            "status": "paused",
                            "node_id": current_node,
                            "output": output
                        })
                        return
                    
                    db.commit() 
                    await ws_manager.broadcast(execution_id, {
                        "type": "NODE_COMPLETED",
                        "status": output.get("status", "success"),
                        "node_id": current_node,
                        "output": output
                    })
                    
                    is_conditional_node = output.get('branch')
                    next_nodes = connection.get(current_node, [])
                    for nodes in reversed(next_nodes):
                        handler = nodes.get('handler')
                        if handler in ['tool', 'memory', 'chatModel']:
                            continue
                        if not is_conditional_node:
                            stack.append(nodes['target'])
                        elif is_conditional_node == nodes.get('handler'):
                            stack.append(nodes['target'])

                except Exception as error:
                    print(f" [RESUME ERROR] Node {cn} crashed: {error}")
                    print(traceback.format_exc())
                    execution.status = 'failed'
                    execution.state = global_state
                    db.commit()
                    await ws_manager.broadcast(execution_id, {
                        "type": "NODE_COMPLETED",
                        "status": "failed",
                        "node_id": cn,
                        "output": {"error": str(error)}
                    })
                    break

        except Exception as error:
            print(f" [RESUME FATAL CRASH] Entire engine failed: {error}")
            print(traceback.format_exc())
            
        finally:
            print("Closing Database Session.")
            db.close()

  

    async def run_webhook(self, db: Session, webhook_id: str, request: Request, background_tasks: BackgroundTasks):
        webhook = self.repo.find_webhook(db=db, webhook_id=webhook_id)
    
        if not webhook or webhook.method not in ["GET", "POST", "ANY"]:
            raise HTTPException(status_code=404, detail="Invalid or inactive webhook call")

        payload: dict[str, Any] = {}
        if webhook.method == 'POST' or request.method == 'POST':
            try:
                payload = await request.json()
            except Exception:
                form_data = await request.form()
                payload = dict(form_data)
                
        elif webhook.method == 'GET' or request.method == 'GET':
            payload = dict(request.query_params)
        
        workflow = db.query(Workflow).filter_by(id=webhook.workflow_id).first()
        if not workflow:
            raise HTTPException(status_code=404, detail="Invalid workflow")
        
        execution = Execution(
            workflow_id=workflow.id,
            status="running",
            state={webhook.node_id: {"status": "success", "output": payload}}
        )
        db.add(execution)
        db.commit()
        db.refresh(execution)
        await ws_manager.broadcast_to_workflow(workflow.id, {
            "type": "EXECUTION_STARTED",
            "execution_id": execution.id,
            "trigger": "webhook"
        })
        background_tasks.add_task(
            self.run_execution,
            workflow_id=workflow.id,
            execution_id=execution.id,
            trigger_node=webhook.node_id,
            trigger_data=payload
        )
    
        return {"message": "Webhook received, workflow triggered", "execution_id": execution.id}

# app/modules/execution/service.py - add these two methods

    async def save_form(self, db: Session, workflow_id: str, node_id: str,
                        form_elements: list[str], form_title: str,
                        form_description: str, user_id: str):
        from app.modules.users.model import User
        tenant_id = db.query(User.accountName).filter_by(id=user_id).scalar()
        if not tenant_id:
            raise HTTPException(status_code=404, detail="Invalid Request")

        form = self.repo.save_form_config(
            db=db,
            workflow_id=workflow_id,
            node_id=node_id,
            form_elements=form_elements,
            form_title=form_title or "",
            form_description=form_description or "",
            account_name=tenant_id
        )

        frontend_domain = f"https://{tenant_id}.nexflow.vaibhavr.com"
        form_url = f"{frontend_domain}/form/{form.id}"

        return {"form_id": form.id, "url": form_url}

    async def submit_form(self, db: Session, form_id: str, 
                          field_values: dict[str,Any], background_tasks: BackgroundTasks):
        form = self.repo.get_form_config(db=db, form_id=form_id)
        if not form:
            raise HTTPException(status_code=404, detail="Form not found")

        sanitized = {k.replace(" ", "_"): v for k, v in field_values.items()}
        trigger_data = {"fields": sanitized, "form_id": form_id}
        trigger_data:dict[str,Any] = {"fields": field_values, "form_id": form_id}

        execution = Execution(
            workflow_id=form.workflow_id,
            status="running",
            state={form.node_id: {"status": "success", "output": trigger_data}}
        )
        db.add(execution)
        db.commit()
        db.refresh(execution)
        await ws_manager.broadcast_to_workflow(form.workflow_id, {
                "type": "EXECUTION_STARTED",
                "execution_id": execution.id,
                "trigger": "form"
            })
        background_tasks.add_task(
            self.run_execution,
            workflow_id=form.workflow_id,
            execution_id=execution.id,
            trigger_node=form.node_id,
            trigger_data=trigger_data
        )

        return {"message": "Form submitted successfully", "execution_id": execution.id}