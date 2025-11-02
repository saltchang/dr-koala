"""In-memory session repository implementation."""

from datetime import UTC, datetime, timedelta

from core.enum.session import MessageRole
from core.model.session import Message, Session
from utility.decorator import singleton


@singleton
class SessionMemoryRepository:
    """In-memory storage for sessions."""

    def __init__(self):
        """Initialize the repository with an empty sessions dictionary."""
        self._sessions: dict[str, Session] = {}

    def create_session(self, session_id: str | None = None) -> Session:
        """
        Create a new session.
        """
        session = Session(session_id=session_id) if session_id else Session()
        self._sessions[session.session_id] = session
        return session

    def get_session(self, session_id: str) -> Session | None:
        """
        Retrieve a session by ID.
        """
        return self._sessions.get(session_id)

    def add_message(self, session_id: str, role: MessageRole, content: str) -> None:
        """
        Add a message to an existing session.
        """
        session = self._sessions.get(session_id)
        if session is None:
            raise KeyError(f'Session {session_id} not found')
        session.add_message(role=role, content=content)

    def get_recent_messages(self, session_id: str, max_turns: int = 5) -> list[Message]:
        """
        Get recent messages from a session.
        """
        session = self._sessions.get(session_id)
        if session is None:
            return []
        return session.get_recent_messages(max_turns=max_turns)

    def cleanup_old_sessions(self, hours: int = 1) -> int:
        """
        Remove sessions older than specified hours.
        """
        cutoff_time = datetime.now(UTC) - timedelta(hours=hours)
        sessions_to_remove = [
            session_id for session_id, session in self._sessions.items() if session.updated_at < cutoff_time
        ]

        for session_id in sessions_to_remove:
            del self._sessions[session_id]

        return len(sessions_to_remove)
