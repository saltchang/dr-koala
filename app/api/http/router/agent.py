import asyncio
import json

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from api.http.dependencies.agent import AgentServiceDependency
from api.http.schema.agent import AskAgentRequest, AskAgentResponseStreamChunkModel
from service.agent import AgentService

router = APIRouter(prefix='', tags=['Agent'])


async def agent_response_stream(agent_service: AgentService, query: str, session_id: str):
    async for event_type, data in agent_service.process_query_stream(query, session_id):
        chunk = None
        if event_type == 'content':
            chunk = AskAgentResponseStreamChunkModel(content=data['content'])
        elif event_type == 'done':
            chunk = AskAgentResponseStreamChunkModel(done=True)
        elif event_type == 'error':
            chunk = AskAgentResponseStreamChunkModel(error=data['error'])

        if chunk is not None:
            yield f'data: {json.dumps(chunk.model_dump())}\n\n'
            await asyncio.sleep(0)


@router.post('/ask-agent', response_model=AskAgentResponseStreamChunkModel)
async def ask_agent(request: AskAgentRequest, agent_service: AgentServiceDependency):
    return StreamingResponse(
        agent_response_stream(agent_service, request.query, request.session_id),
        media_type='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    )
