"""In-memory session repository implementation."""

from datetime import UTC, datetime, timedelta

from core.enum.session import MessageRole
from core.model.session import Message, Session
from utility.decorator import singleton


@singleton
class SessionMemoryRepository:
    """In-memory storage for session sessions."""

    def __init__(self):
        """Initialize the repository with an empty sessions dictionary."""
        self._sessions: dict[str, Session] = {}

    def create_session(self, session_id: str | None = None) -> Session:
        """
        Create a new session session.

        Args:
            session_id: Optional session ID, generates new UUID if not provided

        Returns:
            New Session instance
        """
        session = Session(session_id=session_id) if session_id else Session()
        self._sessions[session.session_id] = session
        return session

    def get_session(self, session_id: str) -> Session | None:
        """
        Retrieve a session session by ID.

        Args:
            session_id: Session identifier

        Returns:
            Session if found, None otherwise
        """
        return self._sessions.get(session_id)

    def add_message(self, session_id: str, role: MessageRole, content: str) -> None:
        """
        Add a message to an existing session.

        Args:
            session_id: Session identifier
            role: Message role (user/assistant)
            content: Message content

        Raises:
            KeyError: If session_id not found
        """
        session = self._sessions.get(session_id)
        if session is None:
            raise KeyError(f'Session {session_id} not found')
        session.add_message(role=role, content=content)

    def get_recent_messages(self, session_id: str, max_turns: int = 5) -> list[Message]:
        """
        Get recent messages from a session.

        Args:
            session_id: Session identifier
            max_turns: Maximum number of session turns to return

        Returns:
            List of recent messages, empty list if session not found
        """
        session = self._sessions.get(session_id)
        if session is None:
            return []
        return session.get_recent_messages(max_turns=max_turns)

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
            session_id for session_id, session in self._sessions.items() if session.updated_at < cutoff_time
        ]

        for session_id in sessions_to_remove:
            del self._sessions[session_id]

        return len(sessions_to_remove)
