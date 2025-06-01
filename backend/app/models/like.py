from sqlalchemy import Column, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.core.database import Base


class Like(Base):
    __tablename__ = "likes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    track_id = Column(UUID(as_uuid=True), ForeignKey("tracks.id"))
    created_at = Column(DateTime, default=func.now())
    
    # Связи
    user = relationship("User", back_populates="likes")
    track = relationship("Track", back_populates="likes") 