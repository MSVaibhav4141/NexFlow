from pydantic import BaseModel, Field
from typing import Optional # <--- Add this import

class TelegramToolSchema(BaseModel):
    # Change str to Optional[str] and add default=None
    message: Optional[str] = Field(
        default=None,
        description="The exact text message you want to send. Leave null if using the pre-configured node setting."
    )

class EmailToolSchema(BaseModel):
    to_email: Optional[str] = Field(
        default=None,
        description="The recipient's email address. Leave null if using pre-configured."
    )
    subject: Optional[str] = Field(
        default=None,
        description="The subject line of the email. Leave null if using pre-configured."
    )
    body: Optional[str] = Field(
        default=None,
        description="The main text content. Leave null if using pre-configured."
    )

class AgentAiToolSchema(BaseModel):
    # This one DOES NOT get Optional, because the Sub-Agent ALWAYS needs a query to function!
    query: str = Field(
        description="The specific question, instruction, or task you want to delegate to this sub-agent."
    )