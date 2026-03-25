from .parser import parse_template, safe_float
import httpx
from .actions.ai_agent import execute_ai_agent
from .actions.sendEmails import execute_send_email
# from app.config import settings
from typing import Any, Dict
from app.modules.credentials.utils import get_credential_data


    
def if_else_exec(node:dict[str, Any], global_state:dict[str,Any])-> Dict[str, Any]:

    config = node.get("data", {}).get("config", {})

    val1 = parse_template(config.get("value1", ""), global_state)
    val2 = parse_template(config.get("value2", ""), global_state)
    operator = config.get("operator", "equals")

    result = False

    try:
        if operator == "equals":
            result = str(val1) == str(val2)
        elif operator == "not_equals":
            result = str(val1) != str(val2)
        elif operator == "greater_than":
            result = safe_float(val1) > safe_float(val2)
        elif operator == "less_than":
            result = safe_float(val1) < safe_float(val2)
        elif operator == "contains":
            result = str(val2).lower() in str(val1).lower()
    except Exception as e:
        print(f"Condition evaluation error: {e}")
        result = False

        
    branch_chosen = "true" if result else "false"
    
    return {
        "status": "success",
        "branch": branch_chosen,
    }



async def execute_send_telegram(node: Dict[str, Any], global_state: Dict[str, Any]) -> Dict[str, Any]:

    config:dict[Any,Any] = node.get("data", {}).get("config", {})
    
    raw_chat_id = config.get("chatId", "")
    raw_message = config.get("message", "")
    
    chat_id = parse_template(raw_chat_id, global_state)
    message_text = parse_template(raw_message, global_state)
    operation = config.get("operation", "sendOnly")
    
    credential_id = config.get("credential_id", "")
    if not credential_id:
        return {"status": "failed", "error": "No credential selected for Telegram"}

    cred_data = get_credential_data(credential_id)
    bot_token = cred_data.get("bot_token", "")

    if not bot_token:
        return {"status": "failed", "error": "Telegram credential missing bot_token"}

    if not isinstance(chat_id, str):
        return {"status": "failed", "error": "Missing chat id"}


    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"

    payload:dict[str,Any] = {
        "chat_id": chat_id,
        "text": message_text if isinstance(message_text,str) else "" ,
        # "parse_mode": "HTML"
    }
    
    if operation == "sendAndWait":
        approve_text = config.get("approveText", "Approve")
        reject_text = config.get("rejectText", "Reject")
        
        payload["reply_markup"] = {
            "inline_keyboard": [
                [
                    {"text": approve_text, "callback_data": f"approve_{node['id']}"},
                    {"text": reject_text, "callback_data": f"reject_{node['id']}"}
                ]
            ]
        }
        
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(url, json=payload)
            response.raise_for_status() 
            data = response.json()
            
            final_status = "paused" if operation == "sendAndWait" else "success"
            
            return {
                "status": final_status,
                "message_id": data.get("result", {}).get("message_id"),
                "delivered_to": chat_id,
                "operation": operation
            }
            
        except httpx.HTTPStatusError as e:
            print(f"Telegram API Error: {e.response.text}")
            return {"status": "failed", "error": f"Telegram API rejected the request: {e.response.status_code}"}
         



TASK_REGISTRY:dict[str,Any] = {
    "ifElse": if_else_exec,
    "sendTelegram": execute_send_telegram,
    "agentAi": execute_ai_agent,
    "sendEmail":execute_send_email
}
    