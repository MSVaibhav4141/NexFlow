from __future__ import annotations
from sqlalchemy import String, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.db import Base
from cuid2 import cuid_wrapper
from typing import Any, TYPE_CHECKING

if TYPE_CHECKING:
    from app.modules.users.model import User

cuid_gen = cuid_wrapper()

class Credential(Base):
    __tablename__ = "credentials"

    id: Mapped[str] = mapped_column(String, primary_key=True, index=True, default=cuid_gen)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String, nullable=False)
    service: Mapped[str] = mapped_column(String, nullable=False)
    data: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    user: Mapped["User"] = relationship("User",back_populates="credentials")