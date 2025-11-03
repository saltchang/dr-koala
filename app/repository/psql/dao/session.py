from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from core.enum.session import MessageRole
from core.model.session import Message, ProcessingStep, Session
from core.protocol.repository.session import SessionRepositoryProtocol

from ..model import DbMessage, DbSession


class PsqlSessionRepository(SessionRepositoryProtocol):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_session(self, title: str, session_id: str | None = None) -> Session:
        core_session = Session(session_id=session_id, title=title) if session_id else Session(title=title)
        db_session = DbSession.from_core(core_session)

        try:
            self.session.add(db_session)
            await self.session.commit()
            await self.session.refresh(db_session)
            return db_session.to_core()
        except SQLAlchemyError:
            await self.session.rollback()
            raise

    async def get_session(self, session_id: str) -> Session | None:
        result = await self.session.execute(select(DbSession).where(DbSession.session_id == session_id))
        db_session = result.scalar_one_or_none()
        return db_session.to_core() if db_session else None

    async def add_message(
        self, session_id: str, role: MessageRole, content: str, steps: list[ProcessingStep] | None = None
    ) -> None:
        result = await self.session.execute(select(DbSession).where(DbSession.session_id == session_id))
        db_session = result.scalar_one_or_none()

        if db_session is None:
            raise KeyError(f'Session {session_id} not found')

        core_message = Message(role=role, content=content, steps=steps or [])
        db_message = DbMessage.from_core(core_message, session_id=session_id)

        db_session.messages.append(db_message)

        try:
            await self.session.commit()
            await self.session.refresh(db_session)
        except SQLAlchemyError:
            await self.session.rollback()
            raise

    async def get_recent_messages(self, session_id: str, max_turns: int = 5) -> list[Message]:
        core_session = await self.get_session(session_id)
        if core_session is None:
            return []
        return core_session.get_recent_messages(max_turns=max_turns)

    async def get_all_sessions(self) -> list[Session]:
        result = await self.session.execute(select(DbSession).order_by(DbSession.update_time.desc()))
        return [db_session.to_core() for db_session in result.scalars().all()]
