import asyncio
import json
import logging

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from api.http.schema.agent import (
    AskAgentResponseStreamChunkDataModel,
    AskAgentResponseStreamChunkModel,
)
from config.settings import MAX_SESSION_CONTEXT_TURNS
from core.enum.session import MessageRole
from repository.memory.session import SessionMemoryRepository
from service.agent_service import AgentService

router = APIRouter(prefix='', tags=['Agent'])
logger = logging.getLogger(__name__)


class AgentQueryRequest(BaseModel):
    """Request model for agent query."""

    query: str
    session_id: str | None = None


async def agent_response_stream(query: str, session_id: str | None = None):
    """
    Generate server-sent events with agent responses.
    """
    agent_service = AgentService()
    session_repo = SessionMemoryRepository()

    if session_id:
        session = session_repo.get_session(session_id)
        if session is None:
            session = session_repo.create_session()
            session_id = session.session_id
    else:
        session = session_repo.create_session()
        session_id = session.session_id

    yield f'data: {json.dumps(AskAgentResponseStreamChunkModel(data=AskAgentResponseStreamChunkDataModel(session_id=session_id)).model_dump())}\n\n'

    try:
        session_repo.add_message(session_id, MessageRole.USER, query)

        session_history = session_repo.get_recent_messages(session_id, MAX_SESSION_CONTEXT_TURNS)

        full_response = ''
        async for chunk in agent_service.run_agent_stream(
            task=query, session_history=session_history, max_context_turns=MAX_SESSION_CONTEXT_TURNS
        ):
            if chunk:
                full_response += chunk
                yield f'data: {json.dumps(AskAgentResponseStreamChunkModel(content=chunk).model_dump())}\n\n'

                await asyncio.sleep(0)

        session_repo.add_message(session_id, MessageRole.ASSISTANT, full_response)

        yield f'data: {json.dumps(AskAgentResponseStreamChunkModel(done=True).model_dump())}\n\n'

    except Exception as e:
        logger.error(f'Error in agent stream: {e}', exc_info=True)
        yield f'data: {json.dumps(AskAgentResponseStreamChunkModel(error=str(e)).model_dump())}\n\n'


@router.post('/ask-agent', response_model=AskAgentResponseStreamChunkModel)
async def ask_agent(request: AgentQueryRequest):
    """
    Ask the agent a question.
    """
    return StreamingResponse(
        agent_response_stream(request.query, request.session_id),
        media_type='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    )
