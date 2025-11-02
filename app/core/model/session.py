"""Session and message data models."""

from datetime import UTC, datetime
from typing import Literal
from uuid import uuid4

from pydantic import BaseModel, Field

from core.enum.session import MessageRole


class ProcessingStep(BaseModel):
    description: str
    status: Literal['in_progress', 'completed']
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))


class Message(BaseModel):
    role: MessageRole
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))
    steps: list[ProcessingStep] = Field(default_factory=list)


class SessionTurn(BaseModel):
    query: str
    response: str
    timestamp: str
    sources: list[str] = Field(default_factory=list)
    steps: list[ProcessingStep] = Field(default_factory=list)


class Session(BaseModel):
    session_id: str = Field(default_factory=lambda: str(uuid4()))
    title: str
    messages: list[Message] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    def add_message(self, role: MessageRole, content: str, steps: list[ProcessingStep] | None = None) -> None:
        """Add a message to the session."""
        self.messages.append(Message(role=role, content=content, steps=steps or []))
        self.updated_at = datetime.now(UTC)

    def get_recent_messages(self, max_turns: int = 5) -> list[Message]:
        """
        Get recent messages limited by number of turns.

        Args:
            max_turns: Maximum number of session turns (user+assistant pairs) to return

        Returns:
            List of recent messages, limited to max_turns * 2 messages
        """
        max_messages = max_turns * 2
        return self.messages[-max_messages:] if len(self.messages) > max_messages else self.messages

    def get_turns(self) -> list[SessionTurn]:
        """
        Convert messages to structured turns for card-based UI.

        Returns:
            List of session turns with query-response pairs
        """
        turns: list[SessionTurn] = []
        current_query: str | None = None
        current_timestamp: datetime | None = None

        for message in self.messages:
            if message.role == MessageRole.USER:
                current_query = message.content
                current_timestamp = message.timestamp
            elif message.role == MessageRole.ASSISTANT and current_query is not None:
                turns.append(
                    SessionTurn(
                        query=current_query,
                        response=message.content,
                        timestamp=(current_timestamp or message.timestamp).isoformat(),
                        sources=[],
                        steps=message.steps,
                    )
                )
                current_query = None
                current_timestamp = None

        return turns
