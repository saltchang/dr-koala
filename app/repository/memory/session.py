from core.enum.session import MessageRole
from core.model.session import Message, ProcessingStep, Session
from core.protocol.repository.session import SessionRepositoryProtocol


class InMemorySessionRepository(SessionRepositoryProtocol):
    def __init__(self):
        self._sessions: dict[str, Session] = {}

    async def create_session(self, title: str, session_id: str | None = None) -> Session:
        session = Session(session_id=session_id, title=title) if session_id else Session(title=title)
        self._sessions[session.session_id] = session
        return session

    async def get_session(self, session_id: str) -> Session | None:
        return self._sessions.get(session_id)

    async def add_message(
        self, session_id: str, role: MessageRole, content: str, steps: list[ProcessingStep] | None = None
    ) -> None:
        session = self._sessions.get(session_id)
        if session is None:
            raise KeyError(f'Session {session_id} not found')
        session.add_message(role=role, content=content, steps=steps)

    async def get_recent_messages(self, session_id: str, max_turns: int = 5) -> list[Message]:
        session = self._sessions.get(session_id)
        if session is None:
            return []
        return session.get_recent_messages(max_turns=max_turns)

    async def get_all_sessions(self) -> list[Session]:
        return sorted(self._sessions.values(), key=lambda s: s.updated_at, reverse=True)

    async def delete_session(self, session_id: str) -> bool:
        if session_id in self._sessions:
            del self._sessions[session_id]
            return True
        return False
