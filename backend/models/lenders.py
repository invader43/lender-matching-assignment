"""Lender model."""

from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Text, DateTime, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
import enum
from database import Base

if TYPE_CHECKING:
    from .policies import Policy


class IngestionStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class Lender(Base):
    """Lender entity - represents a lending institution."""
    __tablename__ = "lenders"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=datetime.utcnow, 
        nullable=False
    )
    
    # Ingestion Status
    ingestion_status: Mapped[Optional[IngestionStatus]] = mapped_column(
        SAEnum(IngestionStatus, name="ingestion_status_enum"),
        nullable=True,
        default=IngestionStatus.PENDING
    )
    ingestion_error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    policies: Mapped[List["Policy"]] = relationship(
        "Policy", 
        back_populates="lender",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Lender(id='{self.id}', name='{self.name}')>"
