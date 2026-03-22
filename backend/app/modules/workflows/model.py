from __future__ import annotations
from sqlalchemy import JSON, DateTime, func, String,ForeignKey
from sqlalchemy.orm import mapped_column, Mapped, relationship
from app.db.db import Base
from datetime import datetime, UTC
from cuid2 import cuid_wrapper
from typing import Any, TYPE_CHECKING
from app.modules.execution.model import Execution
if TYPE_CHECKING:
    from app.modules.users.model import User
cuid_gen = cuid_wrapper()

class Workflow(Base):
    __tablename__="workflows"

    id: Mapped[str] = mapped_column(String, primary_key=True, index=True,default=cuid_gen() )
    nodes: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list, nullable=False)
    edges: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list, nullable=False)
    createdAt: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda:datetime.now(UTC))
    updatedAt: Mapped[datetime] = mapped_column(DateTime(timezone=True), onupdate=func.now(), default=lambda:datetime.now(UTC))
    user_id : Mapped[str] = mapped_column(ForeignKey("users.id", ondelete='CASCADE'))
    execution:Mapped[list[Execution]] = relationship("Execution", back_populates="workflow")
    user: Mapped["User"] = relationship("User", back_populates='workflows')
