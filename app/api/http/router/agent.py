import asyncio
import json
import logging

from fastapi import APIRouter
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel

from config.settings import MAX_CONVERSATION_CONTEXT_TURNS
from core.enum.conversation import MessageRole
from repository.memory.conversation import ConversationMemoryRepository
from service.agent_service import AgentService

router = APIRouter(prefix='/api', tags=['Agent'])
logger = logging.getLogger(__name__)


class AgentQueryRequest(BaseModel):
    """Request model for agent query."""

    query: str
    session_id: str | None = None


async def agent_response_stream(query: str, session_id: str | None = None):
    """
    Generate server-sent events with agent responses.

    Args:
        query: The user's question
        session_id: Optional session ID for conversation continuity
    """
    agent_service = AgentService()
    conversation_repo = ConversationMemoryRepository()

    if session_id:
        conversation = conversation_repo.get_session(session_id)
        if conversation is None:
            conversation = conversation_repo.create_session()
            session_id = conversation.session_id
    else:
        conversation = conversation_repo.create_session()
        session_id = conversation.session_id

    yield f'data: {json.dumps({"session_id": session_id})}\n\n'

    try:
        conversation_repo.add_message(session_id, MessageRole.USER, query)

        conversation_history = conversation_repo.get_recent_messages(session_id, MAX_CONVERSATION_CONTEXT_TURNS)

        full_response = ''
        async for chunk in agent_service.run_agent_stream(
            task=query, conversation_history=conversation_history, max_context_turns=MAX_CONVERSATION_CONTEXT_TURNS
        ):
            if chunk:
                full_response += chunk
                yield f'data: {json.dumps({"content": chunk})}\n\n'

                await asyncio.sleep(0)

        conversation_repo.add_message(session_id, MessageRole.ASSISTANT, full_response)

        yield f'data: {json.dumps({"done": True})}\n\n'

    except Exception as e:
        logger.error(f'Error in agent stream: {e}', exc_info=True)
        yield f'data: {json.dumps({"error": str(e)})}\n\n'


@router.post('/agent/stream')
async def stream_agent_response(request: AgentQueryRequest):
    """
    Stream agent responses via Server-Sent Events (SSE).

    Args:
        request: Contains the user's query and optional session_id
    """
    return StreamingResponse(
        agent_response_stream(request.query, request.session_id),
        media_type='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    )


@router.get('/agent/conversation/{session_id}')
async def get_conversation_history(session_id: str):
    """
    Get conversation history for a session.

    Args:
        session_id: Session identifier

    Returns:
        Conversation messages with role, content, and timestamp
    """
    conversation_repo = ConversationMemoryRepository()
    conversation = conversation_repo.get_session(session_id)

    if conversation is None:
        return {'error': 'Session not found', 'turns': []}

    messages = [
        {
            'role': msg.role.value,
            'content': msg.content,
            'timestamp': msg.timestamp.isoformat(),
        }
        for msg in conversation.messages
    ]
    return JSONResponse(content={'session_id': session_id, 'turns': messages})
