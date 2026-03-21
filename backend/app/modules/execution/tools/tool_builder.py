# app/modules/executions/tools.py
from langchain_core.tools import StructuredTool
from typing import Any, Callable
from .tools import TelegramToolSchema ,EmailToolSchema, AgentAiToolSchema

def build_langchain_tool_from_node(node_id: str, node_type: str, task_function: Callable[..., Any],global_state: dict[str, Any],user_data: dict[str, Any]) -> StructuredTool:

    async def tool_wrapper(**kwargs:Any) -> str:
        print(f"\n[AI Agent] -> Executing Tool: {node_type} ({node_id})")
        print(f"[AI Agent] -> Injected Arguments: {kwargs}")
        

        final_data = user_data
        if node_type == "agentAi":
            try:
                validated_data = AgentAiToolSchema.model_validate(kwargs)
                
                final_data["query"] = validated_data.query
                print(f"[AI Agent] -> Delegating query to Sub-Agent: {validated_data.query}")
                
            except Exception as e:
                return "Error: Invalid arguments passed to Sub-Agent."
        else:
            for key,items in kwargs.items():
                if items is not None:
                    final_data[key] = items
        
        mock_node_data:dict[str, Any] = {
            "id": node_id,
            "type": node_type,
            "execution_id": global_state.get("execution_id"),
            "data": {
                "config": final_data 
            }
        }
        
        try:
            import inspect
            if inspect.iscoroutinefunction(task_function):
                result = await task_function(mock_node_data, global_state)
            else:
                result = task_function(mock_node_data, global_state)
            
            if isinstance(result, dict) and result.get("status") == "failed": #type:ignore
                error_msg = result.get("error", "Unknown tool error") #type:ignore
                return f"CRITICAL TOOL ERROR: {error_msg}. DO NOT RETRY THIS TOOL. Report the failure to the user."
                
            if isinstance(result, dict) and result.get("status") == "success": #type:ignore
                return (
                    f"SUCCESS: The tool executed perfectly. "
                    f"Result: {result}. "
                    f"CRITICAL: YOUR TASK IS NOW COMPLETE. DO NOT CALL THIS TOOL OR ANY OTHER TOOL AGAIN. "
                    f"Output a final confirmation message to the user and stop."
                )
            else:
                return f"Tool output: {result}"
        except Exception as e:
            return f"Error executing tool: {str(e)}"

    # 2. Map the node type to its Pydantic Schema and Description
    # Note: We replace dashes in the node_id because LLM tool names cannot have dashes.
    safe_tool_name = f"{node_type}_{node_id.replace('-', '_')}"
    
    def sync_tool_wrapper(**kwargs: Any) -> str:
        return "Error: This tool must be run asynchronously."
    
    if node_type == "sendTelegram":
        return StructuredTool.from_function( # type: ignore
            func=sync_tool_wrapper,         # <--- Dummy sync fallback
            coroutine=tool_wrapper,
            name=safe_tool_name,
            description="Use this tool to send a Telegram message. Call this when you need to notify the user via chat.",
            args_schema=TelegramToolSchema,
        )# type: ignore
        
    elif node_type == "sendEmail":
        return StructuredTool.from_function( # type: ignore
            func=sync_tool_wrapper,         # <--- Dummy sync fallback
            coroutine=tool_wrapper,
            name=safe_tool_name,
            description="Use this tool to send an email. Call this when you need to email the user a report or long-form information.",
            args_schema=EmailToolSchema,
        ) 

    elif node_type == "agentAi":
        user_desc = user_data.get('tool_spec')
        fallback_prompt = user_data.get('user_prompt', 'A helpful AI sub-agent.')
        final_description = user_desc if user_desc else f"Use this AI agent to handle tasks related to: {fallback_prompt}"
        return StructuredTool.from_function(# type: ignore
            func=sync_tool_wrapper,         # <--- Dummy sync fallback
            coroutine=tool_wrapper,
            name=safe_tool_name,
            description=final_description,
            args_schema=AgentAiToolSchema
        )
        
    else:
        raise ValueError(f"No tool schema registered for node type: {node_type}")