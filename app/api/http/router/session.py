from fastapi import APIRouter

from api.http.dependencies.session import SessionServiceDependency
from api.http.schema.session import (
    CreateSessionRequestModel,
    RetrieveSessionResponseModel,
)
from core.error import NotFoundError

router = APIRouter(prefix='/sessions', tags=['Sessions'])


@router.post('', response_model=RetrieveSessionResponseModel)
async def create_session(request: CreateSessionRequestModel, session_service: SessionServiceDependency):
    session = await session_service.create_session(title=request.title)
    return RetrieveSessionResponseModel(id=session.session_id, title=session.title, turns=[])


@router.get('', response_model=list[RetrieveSessionResponseModel])
async def get_all_sessions(session_service: SessionServiceDependency):
    sessions = await session_service.get_all_sessions()
    return [
        RetrieveSessionResponseModel(
            id=session.session_id,
            title=session.title,
            turns=session.get_turns(),
            in_progress_query=session.get_in_progress_query(),
        )
        for session in sessions
    ]


@router.get('/{session_id}', response_model=RetrieveSessionResponseModel)
async def get_session_by_id(session_id: str, session_service: SessionServiceDependency):
    session = await session_service.get_session(session_id)

    if not session:
        raise NotFoundError('Session not found')

    return RetrieveSessionResponseModel(
        id=session.session_id,
        title=session.title,
        turns=session.get_turns(),
        in_progress_query=session.get_in_progress_query(),
    )
