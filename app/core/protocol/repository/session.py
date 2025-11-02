"""Protocol for session repository."""

from typing import Protocol

from core.model.session import Message, Session


class SessionRepositoryProtocol(Protocol):
    """Protocol for session storage and retrieval."""

    def create_session(self, session_id: str | None = None) -> Session:
        """
        Create a new session session.

        Args:
            session_id: Optional session ID, generates new UUID if not provided

        Returns:
            New Session instance
        """
        ...

    def get_session(self, session_id: str) -> Session | None:
        """
        Retrieve a session session by ID.

        Args:
            session_id: Session identifier

        Returns:
            Session if found, None otherwise
        """
        ...

    def add_message(self, session_id: str, role: str, content: str) -> None:
        """
        Add a message to an existing session.

        Args:
            session_id: Session identifier
            role: Message role (user/assistant)
            content: Message content
        """
        ...

    def get_recent_messages(self, session_id: str, max_turns: int = 5) -> list[Message]:
        """
        Get recent messages from a session.

        Args:
            session_id: Session identifier
            max_turns: Maximum number of session turns to return

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
