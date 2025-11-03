import asyncio
import logging
from collections.abc import AsyncIterator
from datetime import UTC, datetime

from core.enum.agent import AgentEventTypeEnum

logger = logging.getLogger(__name__)


class AgentTask:
    def __init__(self, session_id: str, query: str):
        self.session_id = session_id
        self.query = query
        self.started_at = datetime.now(UTC)
        self.events: list[tuple[AgentEventTypeEnum, dict]] = []
        self.is_complete = False
        self.error: str | None = None
        self.subscribers: set[asyncio.Queue] = set()
        self._lock = asyncio.Lock()

    async def add_event(self, event_type: AgentEventTypeEnum, data: dict) -> None:
        """Add an event and notify all subscribers."""
        async with self._lock:
            self.events.append((event_type, data))

            if event_type == AgentEventTypeEnum.DONE:
                self.is_complete = True
            elif event_type == AgentEventTypeEnum.ERROR:
                self.is_complete = True
                self.error = data.get('error')

            dead_queues: set[asyncio.Queue] = set()
            for queue in self.subscribers:
                try:
                    # notify all subscribers
                    queue.put_nowait((event_type, data))
                except Exception as e:
                    logger.warning(f'Failed to notify subscriber: {e}')
                    dead_queues.add(queue)

            self.subscribers -= dead_queues

    async def subscribe(self) -> AsyncIterator[tuple[AgentEventTypeEnum, dict]]:
        """Subscribe to events from this task, including replaying past events."""
        queue: asyncio.Queue[tuple[AgentEventTypeEnum, dict] | None] = asyncio.Queue()

        async with self._lock:
            for event_type, data in self.events:
                await queue.put((event_type, data))

            if self.is_complete:
                await queue.put(None)
            else:
                self.subscribers.add(queue)

        try:
            while True:
                item = await queue.get()
                if item is None:
                    break
                yield item
        finally:
            async with self._lock:
                self.subscribers.discard(queue)

    async def unsubscribe(self, queue: asyncio.Queue) -> None:
        """Remove a subscriber."""
        async with self._lock:
            self.subscribers.discard(queue)


class AgentTaskManager:
    """Manages agent processing tasks across sessions."""

    def __init__(self):
        self._tasks: dict[str, AgentTask] = {}
        self._lock = asyncio.Lock()
        self._cleanup_task: asyncio.Task | None = None

    async def start(self) -> None:
        """Start the task manager and cleanup scheduler."""
        if self._cleanup_task is None:
            self._cleanup_task = asyncio.create_task(self._cleanup_loop())

    async def stop(self) -> None:
        """Stop the task manager and cleanup scheduler."""
        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
            self._cleanup_task = None

    async def _cleanup_loop(self) -> None:
        """Periodically clean up completed tasks that have no subscribers."""
        while True:
            try:
                await asyncio.sleep(300)  # every 5 minutes
                await self._cleanup_old_tasks()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f'Error in cleanup loop: {e}', exc_info=True)

    async def _cleanup_old_tasks(self) -> None:
        """Remove completed tasks with no subscribers that are older than 1 hour."""
        async with self._lock:
            now = datetime.now(UTC)
            keys_to_remove = []

            for key, task in self._tasks.items():
                if task.is_complete and not task.subscribers:
                    age = (now - task.started_at).total_seconds()
                    if age > 3600:  # 1 hour
                        keys_to_remove.append(key)

            for key in keys_to_remove:
                logger.info(f'Cleaning up old task: {key}')
                del self._tasks[key]

    async def get_or_create_task(self, session_id: str, query: str) -> tuple[AgentTask, bool]:
        """
        Get existing task or create a new one.

        Returns:
            Tuple of (task, is_new) where is_new indicates if the task was just created
        """
        async with self._lock:
            key = f'{session_id}:{query}'

            if key in self._tasks:
                task = self._tasks[key]
                logger.info(f'Reusing existing task for session {session_id}')
                return task, False
            else:
                task = AgentTask(session_id, query)
                self._tasks[key] = task
                logger.info(f'Created new task for session {session_id}')
                return task, True

    async def remove_task(self, session_id: str, query: str) -> None:
        """Remove a task."""
        async with self._lock:
            key = f'{session_id}:{query}'
            if key in self._tasks:
                del self._tasks[key]

    async def get_active_tasks_count(self) -> int:
        """Get the number of active tasks."""
        async with self._lock:
            return len([task for task in self._tasks.values() if not task.is_complete])


_task_manager: AgentTaskManager | None = None


def get_task_manager() -> AgentTaskManager:
    """Get or create the global task manager instance."""
    global _task_manager
    if _task_manager is None:
        _task_manager = AgentTaskManager()
    return _task_manager
