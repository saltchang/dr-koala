from pydantic import BaseModel


class AskAgentResponseStreamChunkDataModel(BaseModel):
    """Data payload in agent stream chunks."""

    session_id: str | None = None


class AskAgentResponseStreamChunkModel(BaseModel):
    """SSE chunk model for agent stream responses."""

    content: str | None = None
    data: AskAgentResponseStreamChunkDataModel | None = None
    done: bool | None = None
    error: str | None = None
