from datetime import datetime
from typing import Literal, cast

from sqlalchemy import DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.enum.session import MessageRole
from core.model.session import Message, ProcessingStep, Session

from .base import Base, TimestampedMixin


class DbProcessingStep(Base):
    __tablename__ = 'processing_step'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    message_id: Mapped[int] = mapped_column(Integer, ForeignKey('message.id', ondelete='CASCADE'), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(Text, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    message: Mapped['DbMessage'] = relationship('DbMessage', back_populates='steps')

    def to_core(self) -> ProcessingStep:
        return ProcessingStep(
            description=self.description,
            status=cast(Literal['in_progress', 'completed'], self.status),
            timestamp=self.timestamp,
        )

    @classmethod
    def from_core(cls, step: ProcessingStep, message_id: int | None = None) -> 'DbProcessingStep':
        return cls(
            message_id=message_id,
            description=step.description,
            status=step.status,
            timestamp=step.timestamp,
        )


class DbMessage(Base):
    __tablename__ = 'message'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(Text, ForeignKey('session.session_id', ondelete='CASCADE'), nullable=False)
    role: Mapped[str] = mapped_column(Text, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    session: Mapped['DbSession'] = relationship('DbSession', back_populates='messages')
    steps: Mapped[list['DbProcessingStep']] = relationship(
        'DbProcessingStep',
        back_populates='message',
        cascade='all, delete-orphan',
        lazy='selectin',
    )

    def to_core(self) -> Message:
        return Message(
            role=MessageRole(self.role),
            content=self.content,
            timestamp=self.timestamp,
            steps=[step.to_core() for step in self.steps],
        )

    @classmethod
    def from_core(cls, message: Message, session_id: str | None = None) -> 'DbMessage':
        return cls(
            session_id=session_id,
            role=message.role.value,
            content=message.content,
            timestamp=message.timestamp,
            steps=[DbProcessingStep.from_core(step) for step in message.steps],
        )


class DbSession(Base, TimestampedMixin):
    __tablename__ = 'session'

    session_id: Mapped[str] = mapped_column(Text, primary_key=True)
    title: Mapped[str] = mapped_column(Text, nullable=False)

    messages: Mapped[list['DbMessage']] = relationship(
        'DbMessage',
        back_populates='session',
        cascade='all, delete-orphan',
        lazy='selectin',
        order_by='DbMessage.timestamp',
    )

    def to_core(self) -> Session:
        return Session(
            session_id=self.session_id,
            title=self.title,
            messages=[msg.to_core() for msg in self.messages],
            created_at=self.create_time,
            updated_at=self.update_time,
        )

    @classmethod
    def from_core(cls, session: Session) -> 'DbSession':
        return cls(
            session_id=session.session_id,
            title=session.title,
            messages=[DbMessage.from_core(msg, session.session_id) for msg in session.messages],
        )
