from app.modules.credentials.utils import get_credential_data
from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage, BaseMessage
from langchain_core.tools import StructuredTool
from typing import Any, Annotated, TypedDict
from langgraph.graph import StateGraph, START # type: ignore
from langgraph.graph.message import add_messages # type: ignore
from langgraph.prebuilt import ToolNode, tools_condition
from ..tools.tool_builder import build_langchain_tool_from_node
from ..websocket import ws_manager

async def execute_ai_agent(node: dict[str, Any], global_state: dict[str, Any]) -> dict[str, Any]:
    
    data: dict[str, Any] = node.get('data', {}).get('config', {}) 
    print(data)
    llm_model = data.get('llm_model',"")
    llm_model_name = data.get('model_name',"")

    if not llm_model or not llm_model_name:
        return {"error":"No model selected"}
    
    tool_nodes: list[dict[str, Any]] = node.get('tools', [])
    if not tool_nodes and "__workflow_connections" in global_state:
        my_edges = global_state["__workflow_connections"].get(node["id"], [])
        
        my_tool_ids = [edge["target"] for edge in my_edges if edge.get("handler") == "tool"]

        all_nodes = global_state["__workflow_nodes"]
        tool_nodes = [n for n in all_nodes if n["id"] in my_tool_ids]

    superior_agent_query: str = data.get('query', "")
    user_system_prompt: str = data.get('user_prompt', "You are a helpful AI assistant.")

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
    
    config: dict[Any, Any] = node.get("data", {}).get("config", {})

    credential_id = config.get("credential_id", "")
    if not credential_id:
        return {"status": "failed", "error": "No credential selected for LLM"}

    cred_data = get_credential_data(credential_id)
    api_key = cred_data.get("api_key", "")

    if not api_key :
        return {"status": "failed", "error": "LLM credential missing"}
    llm = ""
    if llm_model == 'groq':
        llm = ChatGroq(model=llm_model_name, temperature=0, api_key=api_key)
    elif llm_model == 'gemini':
        llm = ChatGoogleGenerativeAI(model=llm_model_name, temperature=0, api_key=api_key)
    else:
        llm = ChatOpenAI(model=llm_model_name, temperature=0, api_key=api_key)
    
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
    
    
    final_answer = ""
    execution_id = node.get('execution_id', "")
    
    async for chunk in compiled_graph.astream(  # type: ignore
        {"messages": messages_to_start}, 
        {"recursion_limit": 25},
        stream_mode="updates"
    ):
        
        for sub_node_name, state_update in chunk.items():
            
            if sub_node_name == "agent":
                last_message = state_update["messages"][-1]
                
                if hasattr(last_message, 'tool_calls') and last_message.tool_calls:
                    tool_names = [t['name'] for t in last_message.tool_calls]
                    log_msg = f"Agent is calling tools: {', '.join(tool_names)}..."
                    
               
                    for t in last_message.tool_calls:
                        parts = t['name'].split('_', 1)
                        if len(parts) > 1:
                            target_id = parts[1].replace('_', '-') 
                            
                            await ws_manager.broadcast(execution_id, {
                                "type": "AI_TOOL_START",
                                "source_id": node["id"],
                                "target_id": target_id,
                                "execution_id": execution_id
                            })
                    await ws_manager.broadcast(execution_id, {
                        "type": "NODE_LOG",
                        "node_id": node["id"],
                        "message": log_msg
                    })
                    print(f"  -> {log_msg}")
                
                elif last_message.content:
                    final_answer = str(last_message.content)

            elif sub_node_name == "tools":
                log_msg = "Tools finished. Agent is evaluating the results..."
             
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
    return {"status": "success", "output": final_answer}