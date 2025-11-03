from typing import Protocol

from core.enum.session import MessageRole
from core.model.session import Message, ProcessingStep, Session


class SessionRepositoryProtocol(Protocol):
    async def create_session(self, title: str, session_id: str | None = None) -> Session: ...

    async def get_session(self, session_id: str) -> Session | None: ...

    async def add_message(
        self, session_id: str, role: MessageRole, content: str, steps: list[ProcessingStep] | None = None
    ) -> None: ...

    async def get_recent_messages(self, session_id: str, max_turns: int = 5) -> list[Message]: ...

    async def get_all_sessions(self) -> list[Session]: ...

    async def delete_session(self, session_id: str) -> bool: ...
