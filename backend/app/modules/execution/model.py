from __future__ import annotations
from sqlalchemy import JSON, DateTime, String, ForeignKey
from sqlalchemy.orm import mapped_column, Mapped, relationship
from app.db.db import Base
from datetime import datetime, UTC
from cuid2 import cuid_wrapper
from typing import Any, TYPE_CHECKING

if TYPE_CHECKING:
    from app.modules.workflows.model import Workflow

cuid_gen = cuid_wrapper()

class Execution(Base):
    __tablename__ = "executions"

    id: Mapped[str] = mapped_column(String, primary_key=True, index=True, default=lambda: cuid_gen())
    workflow_id: Mapped[str] = mapped_column(ForeignKey("workflows.id", ondelete='CASCADE'))
    status: Mapped[str] = mapped_column(String, default="running") 
    state: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    createdAt: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    completedAt: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    workflow: Mapped["Workflow"] = relationship("Workflow", back_populates="execution")