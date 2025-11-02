from pydantic import BaseModel, Field

from core.model.session import SessionTurn


class CreateSessionRequestModel(BaseModel):
    title: str = Field(min_length=1)


class RetrieveSessionResponseModel(BaseModel):
    id: str
    title: str
    turns: list[SessionTurn]
