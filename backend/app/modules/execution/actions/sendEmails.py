import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any
# Assuming you have your parse_template function available
from ..parser import parse_template 

async def execute_send_email(node: Dict[str, Any], global_state: Dict[str, Any]) -> Dict[str, Any]:
    config: dict[Any, Any] = node.get("data", {}).get("config", {})
    
    # 1. Parse all UI inputs
    operation = config.get("operation", "sendOnly")
    to_email = parse_template(config.get("toEmail", ""), global_state)
    subject = parse_template(config.get("subject", "Workflow Alert"), global_state)
    raw_message = parse_template(config.get("message", ""), global_state)
    message_body=str(raw_message) if raw_message is not None else ""
    email_format = config.get("emailFormat", "text")
    
    execution_id = global_state.get("execution_id", "unknown")
    node_id = node.get("id", "")

    # ==========================================
    # 2. INJECT MAGIC LINKS (For Send & Wait)
    # ==========================================
    if operation == "sendAndWait":
        # We append clickable approval links to the bottom of the email
        # (You will route these to a FastAPI webhook we build later)
        base_url = "http://localhost:8084/api/v0/execution/resume" 
        approve_link = f"{base_url}?execution_id={execution_id}&node_id={node_id}&action=approved"
        reject_link = f"{base_url}?execution_id={execution_id}&node_id={node_id}&action=rejected"
        
        append_html = f"""
        <br><br>
        <hr>
        <h3>Action Required</h3>
        <p>Please approve or reject this workflow step:</p>
        <a href="{approve_link}" style="padding: 10px 20px; background-color: #22c55e; color: white; text-decoration: none; border-radius: 5px;">✅ Approve</a>
        &nbsp;&nbsp;
        <a href="{reject_link}" style="padding: 10px 20px; background-color: #ef4444; color: white; text-decoration: none; border-radius: 5px;">❌ Reject</a>
        """
        
        append_text = f"\n\n---\nACTION REQUIRED:\nTo Approve, visit: {approve_link}\nTo Reject, visit: {reject_link}"
        
        if email_format == "html":
            message_body += append_html
        else:
            message_body += append_text

    # ==========================================
    # 3. SEND THE EMAIL (Using Gmail SMTP as an example)
    # ==========================================
    # In production, use environment variables for these!
    SMTP_SERVER = "smtp.gmail.com"
    SMTP_PORT = 587
    SMTP_USERNAME = "vaibhavsingh4141@gmail.com" 
    SMTP_PASSWORD = "uzyqovhspovuwihy" # Use a 16-character App Password, NOT your real password

    msg = MIMEMultipart()
    msg['From'] = SMTP_USERNAME
    msg['To'] = str(to_email)
    msg['Subject'] = str(subject)

    # Attach the body based on the selected format
    subtype = 'html' if email_format == 'html' else 'plain'
    msg.attach(MIMEText(str(message_body), subtype))

    try:
        # Connect to server and send
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        
        # 4. RETURN THE CORRECT STATUS
        # If it's a wait operation, tell the DFS engine to pause!
        final_status = "paused" if operation == "sendAndWait" else "success"
        print(operation)
        return {
            "status": final_status,
            "delivered_to": to_email,
            "operation": operation
        }
        
    except Exception as e:
        print(f"Failed to send email: {str(e)}")
        return {"status": "failed", "error": str(e)}