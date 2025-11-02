from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends

from repository.memory.session import SessionMemoryRepository
from repository.psql.connection import psql_db
from service.session import SessionService


async def get_session_service() -> AsyncGenerator[SessionService]:
    async with psql_db.async_session_maker() as session:
        try:
            yield SessionService(session_repo=SessionMemoryRepository())
        finally:
            await session.close()


SessionServiceDependency = Annotated[SessionService, Depends(get_session_service)]
