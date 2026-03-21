from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage, BaseMessage
from langchain_core.tools import StructuredTool
from typing import Any, Annotated, TypedDict
from langgraph.graph import StateGraph, START # type: ignore
from langgraph.graph.message import add_messages # type: ignore
from langgraph.prebuilt import ToolNode, tools_condition
from ..tools.tool_builder import build_langchain_tool_from_node
from ..websocket import ws_manager
from app.config import settings
# FIX 1: Added 'async'
async def execute_ai_agent(node: dict[str, Any], global_state: dict[str, Any]) -> dict[str, Any]:
    
    data: dict[str, Any] = node.get('data', {}).get('config', {}) 
    tool_nodes: list[dict[str, Any]] = node.get('tools', [])
    if not tool_nodes and "__workflow_connections" in global_state:
        my_edges = global_state["__workflow_connections"].get(node["id"], [])
        
        # Find the IDs of anything wired into THIS specific agent's 'tool' handle
        my_tool_ids = [edge["target"] for edge in my_edges if edge.get("handler") == "tool"]
        
        # Grab the full node configurations for those tools
        all_nodes = global_state["__workflow_nodes"]
        tool_nodes = [n for n in all_nodes if n["id"] in my_tool_ids]

    superior_agent_query: str = data.get('query', "")
    user_system_prompt: str = data.get('user_prompt', "You are a helpful AI assistant.")

    # Explicitly type the tools list
    tools: list[StructuredTool | Any] = []
    
    from ..registry import TASK_REGISTRY
    for node_info in tool_nodes:
        node_id = str(node_info['id'])
        node_type = str(node_info['type'])
        tool_func = TASK_REGISTRY[node_type]
        user_data: dict[str, Any] = node_info.get('data', {}).get('config', {}) 
        
        tool = build_langchain_tool_from_node(
            node_id=node_id, 
            node_type=node_type, 
            task_function=tool_func,
            user_data=user_data, 
            global_state=global_state
        )
        tools.append(tool)
    
    class AgentState(TypedDict):
        messages: Annotated[list[Any], add_messages]
    
    llm = ChatGroq(model='qwen/qwen3-32b', temperature=0, api_key=settings.LLM_API_KEY) #type:ignore 
    
    if tools:
        llm_with_tools = llm.bind_tools(tools) # type: ignore
    else:
        llm_with_tools = llm

    async def call_model(state: AgentState) -> dict[str, Any]:
        response = await llm_with_tools.ainvoke(state["messages"]) # type: ignore
        return {"messages": [response]}

    workflow = StateGraph(AgentState)
    workflow.add_node("agent", call_model) # type: ignore
    
    if tools:
        workflow.add_node("tools", ToolNode(tools)) # type: ignore
        workflow.add_conditional_edges("agent", tools_condition) # type: ignore
        workflow.add_edge("tools", "agent") # type: ignore
        
    workflow.add_edge(START, "agent") # type: ignore
    compiled_graph = workflow.compile() # type: ignore

    # FIX 2: Explicitly declare this list as holding BaseMessages
    messages_to_start: list[BaseMessage] = [
        SystemMessage(
            content=(
                f"{user_system_prompt}\n\n"
                "CRITICAL SYSTEM RULES:\n"
                "1. Only provide tool arguments if you have NEW data from the user. Otherwise, leave them null.\n"
                "2. NEVER loop or call the same tool multiple times if the previous execution was successful. "
                "Once your primary task is complete, output a final summary text and DO NOT output any more tool calls."
            )
        )
    ]
    if superior_agent_query:
        messages_to_start.append(HumanMessage(content=superior_agent_query))
    else:
        messages_to_start.append(HumanMessage(content="Please begin your task."))

    print(f"\n[Engine] Starting LangGraph for AI Node: {node['id']}")
    
    # We use type: ignore here because Pylance struggles with ainvoke return signatures
    # result = await compiled_graph.ainvoke({"messages": messages_to_start}) # type: ignore
    
    final_answer = ""
    execution_id = node.get('execution_id', "")
    
    async for chunk in compiled_graph.astream(  # type: ignore
        {"messages": messages_to_start}, 
        {"recursion_limit": 25},
        stream_mode="updates"
    ):
        # The chunk looks like: {"agent": {"messages": [...]}} OR {"tools": {"messages": [...]}}
        
        for sub_node_name, state_update in chunk.items():
            
            # 1. Did the 'agent' node just finish?
            if sub_node_name == "agent":
                last_message = state_update["messages"][-1]
                
                # Check if the agent decided to call a tool
                if hasattr(last_message, 'tool_calls') and last_message.tool_calls:
                    tool_names = [t['name'] for t in last_message.tool_calls]
                    log_msg = f"Agent is calling tools: {', '.join(tool_names)}..."
                    
                    # ==========================================
                # NEW: Extract Target Node ID and Broadcast Edge Glow!
                # ==========================================
                    for t in last_message.tool_calls:
                    # tool_name looks like: sendTelegram_node_123_456
                        parts = t['name'].split('_', 1)
                        if len(parts) > 1:
                            # Convert underscores back to dashes to get the exact React Flow ID
                            target_id = parts[1].replace('_', '-') 
                            
                            await ws_manager.broadcast(execution_id, {
                                "type": "AI_TOOL_START",
                                "source_id": node["id"],
                                "target_id": target_id
                            })
                # ==========================================
                    
                    # BROADCAST TO FRONTEND
                    # (Ensure ws_manager and execution_id are available in this function scope)
                    await ws_manager.broadcast(execution_id, {
                        "type": "NODE_LOG",
                        "node_id": node["id"],
                        "message": log_msg
                    })
                    print(f"  -> {log_msg}")
                
                # Or did it just output text?
                elif last_message.content:
                    final_answer = str(last_message.content)

            # 2. Did the 'tools' node just finish?
            elif sub_node_name == "tools":
                log_msg = "Tools finished. Agent is evaluating the results..."
               # ==========================================
            # NEW: Tell the UI to turn off the Edge Glow
            # ==========================================
                await ws_manager.broadcast(execution_id, {
                    "type": "AI_TOOL_END",
                    "source_id": node["id"],
                    "target_id": None
                })
                # BROADCAST TO FRONTEND
                await ws_manager.broadcast(execution_id, {
                    "type": "NODE_LOG",
                    "node_id": node["id"],
                    "message": log_msg
                })
                print(f"  -> {log_msg}")

    # ==========================================
    # FINISH AND RETURN
    # ==========================================
    # Once the async for-loop finishes, the agent has reached the END node.
    return {"status": "success", "output": final_answer}