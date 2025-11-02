import logging

from core.enum.session import MessageRole
from core.model.session import Message, Session
from repository.memory.session import SessionMemoryRepository

logger = logging.getLogger(__name__)


class SessionService:
    def __init__(self, session_repo: SessionMemoryRepository):
        self.session_repo = session_repo

    def create_session(self, title: str) -> Session:
        return self.session_repo.create_session(title=title)

    def add_user_message(self, session_id: str, content: str) -> None:
        self.session_repo.add_message(session_id, MessageRole.USER, content)

    def add_assistant_message(self, session_id: str, content: str) -> None:
        self.session_repo.add_message(session_id, MessageRole.ASSISTANT, content)

    def get_recent_messages(self, session_id: str, max_turns: int) -> list[Message]:
        return self.session_repo.get_recent_messages(session_id, max_turns)

    def get_session(self, session_id: str) -> Session | None:
        return self.session_repo.get_session(session_id)

    def get_all_sessions(self) -> list[Session]:
        return self.session_repo.get_all_sessions()
