from pydantic import BaseModel


class AskAgentRequest(BaseModel):
    query: str
    session_id: str


class AskAgentResponseStreamChunkModel(BaseModel):
    """SSE chunk model for agent stream responses."""

    content: str | None = None
    done: bool | None = None
    error: str | None = None
