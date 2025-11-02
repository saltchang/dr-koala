from pydantic import BaseModel

from core.model.session import SessionTurn


class SessionHistoryResponseModel(BaseModel):
    id: str
    turns: list[SessionTurn]
