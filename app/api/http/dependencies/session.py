from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends

from repository.psql.connection import psql_db
from repository.psql.dao.session import PsqlSessionRepository
from service.session import SessionService


async def get_session_service() -> AsyncGenerator[SessionService]:
    async with psql_db.async_session_maker() as session:
        try:
            yield SessionService(session_repo=PsqlSessionRepository(session))
        finally:
            await session.close()


SessionServiceDependency = Annotated[SessionService, Depends(get_session_service)]
