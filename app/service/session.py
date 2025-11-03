import logging

from core.enum.session import MessageRole
from core.model.session import Message, ProcessingStep, Session
from core.protocol.repository.session import SessionRepositoryProtocol

logger = logging.getLogger(__name__)


class SessionService:
    def __init__(self, session_repo: SessionRepositoryProtocol):
        self.session_repo = session_repo

    async def create_session(self, title: str) -> Session:
        return await self.session_repo.create_session(title=title)

    async def add_user_message(self, session_id: str, content: str) -> None:
        await self.session_repo.add_message(session_id, MessageRole.USER, content)

    async def add_assistant_message(
        self, session_id: str, content: str, steps: list[ProcessingStep] | None = None
    ) -> None:
        await self.session_repo.add_message(session_id, MessageRole.ASSISTANT, content, steps=steps)

    async def get_recent_messages(self, session_id: str, max_turns: int) -> list[Message]:
        return await self.session_repo.get_recent_messages(session_id, max_turns)

    async def get_session(self, session_id: str) -> Session | None:
        return await self.session_repo.get_session(session_id)

    async def get_all_sessions(self) -> list[Session]:
        return await self.session_repo.get_all_sessions()
