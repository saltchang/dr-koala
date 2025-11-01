"""In-memory conversation repository implementation."""

from datetime import UTC, datetime, timedelta
from typing import Literal

from core.model.conversation import Conversation, Message
from utility.decorator import singleton


@singleton
class ConversationMemoryRepository:
    """In-memory storage for conversation sessions."""

    def __init__(self):
        """Initialize the repository with an empty sessions dictionary."""
        self._sessions: dict[str, Conversation] = {}

    def create_session(self, session_id: str | None = None) -> Conversation:
        """
        Create a new conversation session.

        Args:
            session_id: Optional session ID, generates new UUID if not provided

        Returns:
            New Conversation instance
        """
        conversation = Conversation(session_id=session_id) if session_id else Conversation()
        self._sessions[conversation.session_id] = conversation
        return conversation

    def get_session(self, session_id: str) -> Conversation | None:
        """
        Retrieve a conversation session by ID.

        Args:
            session_id: Session identifier

        Returns:
            Conversation if found, None otherwise
        """
        return self._sessions.get(session_id)

    def add_message(self, session_id: str, role: Literal['user', 'assistant'], content: str) -> None:
        """
        Add a message to an existing conversation.

        Args:
            session_id: Session identifier
            role: Message role (user/assistant)
            content: Message content

        Raises:
            KeyError: If session_id not found
        """
        conversation = self._sessions.get(session_id)
        if conversation is None:
            raise KeyError(f'Session {session_id} not found')
        conversation.add_message(role=role, content=content)

    def get_recent_messages(self, session_id: str, max_turns: int = 5) -> list[Message]:
        """
        Get recent messages from a conversation.

        Args:
            session_id: Session identifier
            max_turns: Maximum number of conversation turns to return

        Returns:
            List of recent messages, empty list if session not found
        """
        conversation = self._sessions.get(session_id)
        if conversation is None:
            return []
        return conversation.get_recent_messages(max_turns=max_turns)

    def cleanup_old_sessions(self, hours: int = 1) -> int:
        """
        Remove sessions older than specified hours.

        Args:
            hours: Age threshold in hours

        Returns:
            Number of sessions removed
        """
        cutoff_time = datetime.now(UTC) - timedelta(hours=hours)
        sessions_to_remove = [
            session_id for session_id, conversation in self._sessions.items() if conversation.updated_at < cutoff_time
        ]

        for session_id in sessions_to_remove:
            del self._sessions[session_id]

        return len(sessions_to_remove)
