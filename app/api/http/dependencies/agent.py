from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends

from repository.memory.session import SessionMemoryRepository
from repository.psql.connection import psql_db
from service.agent import AgentService
from service.session import SessionService


async def get_agent_service() -> AsyncGenerator[AgentService]:
    async with psql_db.async_session_maker() as session:
        try:
            yield AgentService(
                session_service=SessionService(session_repo=SessionMemoryRepository()),
            )
        finally:
            await session.close()


AgentServiceDependency = Annotated[AgentService, Depends(get_agent_service)]
