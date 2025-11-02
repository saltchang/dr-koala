from fastapi import APIRouter

from api.http.dependencies.session import SessionServiceDependency
from api.http.schema.session import (
    SessionHistoryResponseModel,
)
from core.error import NotFoundError

router = APIRouter(prefix='/sessions', tags=['Sessions'])


@router.post('', response_model=SessionHistoryResponseModel)
async def create_session(session_service: SessionServiceDependency):
    session = session_service.create_session()
    return SessionHistoryResponseModel(id=session.session_id, turns=[])


@router.get('/{session_id}', response_model=SessionHistoryResponseModel)
async def get_session_by_id(session_id: str, session_service: SessionServiceDependency):
    session = session_service.get_session(session_id)

    if not session:
        raise NotFoundError('Session not found')

    return SessionHistoryResponseModel(id=session.session_id, turns=session.get_turns())
