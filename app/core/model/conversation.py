"""Conversation and message data models."""

from datetime import UTC, datetime
from typing import Literal
from uuid import uuid4

from pydantic import BaseModel, Field


class Message(BaseModel):
    """Single message in a conversation."""

    role: Literal['user', 'assistant']
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))


class ConversationTurn(BaseModel):
    """Structured conversation turn for card-based layout."""

    query: str
    response: str
    timestamp: datetime
    sources: list[str] = Field(default_factory=list)


class Conversation(BaseModel):
    """Conversation session with message history."""

    session_id: str = Field(default_factory=lambda: str(uuid4()))
    messages: list[Message] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    def add_message(self, role: Literal['user', 'assistant'], content: str) -> None:
        """Add a message to the conversation."""
        self.messages.append(Message(role=role, content=content))
        self.updated_at = datetime.now(UTC)

    def get_recent_messages(self, max_turns: int = 5) -> list[Message]:
        """
        Get recent messages limited by number of turns.

        Args:
            max_turns: Maximum number of conversation turns (user+assistant pairs) to return

        Returns:
            List of recent messages, limited to max_turns * 2 messages
        """
        max_messages = max_turns * 2
        return self.messages[-max_messages:] if len(self.messages) > max_messages else self.messages

    def get_turns(self) -> list[ConversationTurn]:
        """
        Convert messages to structured turns for card-based UI.

        Returns:
            List of conversation turns with query-response pairs
        """
        turns: list[ConversationTurn] = []
        current_query: str | None = None
        current_timestamp: datetime | None = None

        for message in self.messages:
            if message.role == 'user':
                current_query = message.content
                current_timestamp = message.timestamp
            elif message.role == 'assistant' and current_query is not None:
                turns.append(
                    ConversationTurn(
                        query=current_query,
                        response=message.content,
                        timestamp=current_timestamp or message.timestamp,
                        sources=[],
                    )
                )
                current_query = None
                current_timestamp = None

        return turns
