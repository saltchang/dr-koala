"""Protocol for conversation repository."""

from typing import Protocol

from core.model.conversation import Conversation, Message


class ConversationRepositoryProtocol(Protocol):
    """Protocol for conversation storage and retrieval."""

    def create_session(self, session_id: str | None = None) -> Conversation:
        """
        Create a new conversation session.

        Args:
            session_id: Optional session ID, generates new UUID if not provided

        Returns:
            New Conversation instance
        """
        ...

    def get_session(self, session_id: str) -> Conversation | None:
        """
        Retrieve a conversation session by ID.

        Args:
            session_id: Session identifier

        Returns:
            Conversation if found, None otherwise
        """
        ...

    def add_message(self, session_id: str, role: str, content: str) -> None:
        """
        Add a message to an existing conversation.

        Args:
            session_id: Session identifier
            role: Message role (user/assistant)
            content: Message content
        """
        ...

    def get_recent_messages(self, session_id: str, max_turns: int = 5) -> list[Message]:
        """
        Get recent messages from a conversation.

        Args:
            session_id: Session identifier
            max_turns: Maximum number of conversation turns to return

        Returns:
            List of recent messages
        """
        ...

    def cleanup_old_sessions(self, hours: int = 1) -> int:
        """
        Remove sessions older than specified hours.

        Args:
            hours: Age threshold in hours

        Returns:
            Number of sessions removed
        """
        ...
