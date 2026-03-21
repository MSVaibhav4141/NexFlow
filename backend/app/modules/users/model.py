from app.db.db import Base
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from cuid2 import cuid_wrapper
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from ..workflows.model import Workflow

cuid_gen = cuid_wrapper

class User(Base):
     __tablename__ = "users"

     id: Mapped[str] = mapped_column(String, primary_key=True, index=True, default=cuid_gen())
     name: Mapped[str] = mapped_column(String, nullable=False)
     email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
     accountName: Mapped[str] = mapped_column(String, unique=True, nullable=False)
     password: Mapped[str] = mapped_column(String, nullable=False)

     workflows : Mapped[list["Workflow"]] = relationship("Workflow",back_populates='user')
     
     