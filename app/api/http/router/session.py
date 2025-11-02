import logging

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from api.http.schema.session import (
    SessionHistoryResponseModel,
)
from core.error import NotFoundError
from repository.memory.session import SessionMemoryRepository

router = APIRouter(prefix='/sessions', tags=['Sessions'])
logger = logging.getLogger(__name__)


@router.get('/{session_id}', response_model=SessionHistoryResponseModel)
async def get_session_by_id(session_id: str):
    """
    Get a session by its ID.
    """
    session_repo = SessionMemoryRepository()
    session = session_repo.get_session(session_id)

    if session is None:
        raise NotFoundError('Session not found')

    return JSONResponse(
        content=SessionHistoryResponseModel(id=session.session_id, turns=session.get_turns()).model_dump()
    )
