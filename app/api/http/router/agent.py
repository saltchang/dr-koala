import asyncio
import json

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from api.http.dependencies.agent import AgentServiceDependency
from api.http.schema.agent import (
    AskAgentResponseStreamChunkDataModel,
    AskAgentResponseStreamChunkModel,
)
from service.agent import AgentService

router = APIRouter(prefix='', tags=['Agent'])


class AgentQueryRequest(BaseModel):
    query: str
    session_id: str | None = None


async def agent_response_stream(agent_service: AgentService, query: str, session_id: str | None = None):
    async for event_type, data in agent_service.process_query_stream(query, session_id):
        chunk = None
        if event_type == 'session_id':
            chunk = AskAgentResponseStreamChunkModel(
                data=AskAgentResponseStreamChunkDataModel(session_id=data['session_id'])
            )
        elif event_type == 'content':
            chunk = AskAgentResponseStreamChunkModel(content=data['content'])
        elif event_type == 'done':
            chunk = AskAgentResponseStreamChunkModel(done=True)
        elif event_type == 'error':
            chunk = AskAgentResponseStreamChunkModel(error=data['error'])

        if chunk is not None:
            yield f'data: {json.dumps(chunk.model_dump())}\n\n'
            await asyncio.sleep(0)


@router.post('/ask-agent', response_model=AskAgentResponseStreamChunkModel)
async def ask_agent(request: AgentQueryRequest, agent_service: AgentServiceDependency):
    return StreamingResponse(
        agent_response_stream(agent_service, request.query, request.session_id),
        media_type='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    )
