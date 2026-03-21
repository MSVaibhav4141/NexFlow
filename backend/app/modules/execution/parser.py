from typing import Any
import re

def get_text_value(text:str, global_state:dict[str, Any]):
    keys = text.strip().split(".")
    
    current_value = global_state

    for key in keys:
        if not isinstance(current_value, dict):
            return None
        current_value = current_value[key]
    
    return current_value

def parse_template(text:Any, global_state:dict[str,Any]):

    #not text
    if not isinstance(text, str):  #what if text 26 is recived
        return text
    

    pattern = r"\{\{([^}]+)\}\}"
    matches = re.findall(pattern, text)

    if not matches:
        return text



    if len(matches) == 1 and text.strip() == f"{{{{{matches}}}}}":
        return get_text_value(text=matches[0], global_state=global_state)
    
    for match in matches:
        value = get_text_value(text=match, global_state=global_state)
        text = text.replace(f"{{{{{match}}}}}", str(value) if value is not None else "")
    return text


def safe_float(value: Any) -> float:
    try:
        if value is None:
            return 0.0
        if isinstance(value, (int, float)):
            return float(value)
        if isinstance(value, str):
            return float(value)
        return 0.0
    except (ValueError, TypeError):
        return 0.0