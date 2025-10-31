import asyncio
from datetime import UTC, datetime

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

router = APIRouter(prefix='/api', tags=['Time'])


async def server_time_stream():
    """Generate server-sent events with current server time every second."""
    try:
        while True:
            current_time = datetime.now(UTC).isoformat()
            yield f'data: {current_time}\n\n'
            await asyncio.sleep(1)
    except asyncio.CancelledError:
        pass


@router.get('/time/stream')
async def stream_server_time():
    """Stream server time updates via Server-Sent Events (SSE)."""
    return StreamingResponse(
        server_time_stream(),
        media_type='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',  # Disable buffering in nginx
        },
    )
