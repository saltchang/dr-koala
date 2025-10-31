import asyncio
import json
import logging

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from service.agent_service import AgentService

router = APIRouter(prefix='/api', tags=['Agent'])
logger = logging.getLogger(__name__)


class AgentQueryRequest(BaseModel):
    """Request model for agent query."""

    query: str


async def agent_response_stream(query: str):
    """
    Generate server-sent events with agent responses.

    Args:
        query: The user's question
    """
    agent_service = AgentService()

    try:
        async for chunk in agent_service.run_agent_stream(task=query):
            if chunk:
                yield f'data: {json.dumps({"content": chunk})}\n\n'

                # this allows other tasks of the event loop to run, and prevents blocking the streaming response
                await asyncio.sleep(0)

        yield f'data: {json.dumps({"done": True})}\n\n'

    except Exception as e:
        logger.error(f'Error in agent stream: {e}', exc_info=True)
        yield f'data: {json.dumps({"error": str(e)})}\n\n'


@router.post('/agent/stream')
async def stream_agent_response(request: AgentQueryRequest):
    """
    Stream agent responses via Server-Sent Events (SSE).

    Args:
        request: Contains the user's query
    """
    return StreamingResponse(
        agent_response_stream(request.query),
        media_type='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    )
