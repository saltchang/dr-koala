from typing import Literal

from pydantic import BaseModel


class AskAgentRequest(BaseModel):
    query: str
    session_id: str


class AskAgentResponseStreamChunkModel(BaseModel):
    """SSE chunk model for agent stream responses."""

    content: str | None = None
    step_description: str | None = None
    step_status: Literal['in_progress', 'completed'] | None = None
    done: bool | None = None
    error: str | None = None
