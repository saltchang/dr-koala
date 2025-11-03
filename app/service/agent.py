import json
import logging
import tomllib
from collections.abc import AsyncIterator
from datetime import datetime
from pathlib import Path

from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.base import TaskResult
from autogen_agentchat.messages import (
    ModelClientStreamingChunkEvent,
    TextMessage,
    ThoughtEvent,
    ToolCallExecutionEvent,
    ToolCallRequestEvent,
    ToolCallSummaryMessage,
)
from autogen_agentchat.tools import AgentTool
from autogen_core.models import ModelInfo
from autogen_ext.models.openai import OpenAIChatCompletionClient
from autogen_ext.tools.mcp import McpWorkbench, StdioServerParams
from jinja2 import Template

from config.settings import BRAVE_SEARCH_API_KEY, MAX_SESSION_CONTEXT_TURNS, XAI_API_KEY
from core.enum.agent import AgentEventStepNameEnum, AgentEventTypeEnum
from core.model.session import Message, ProcessingStep
from service.session import SessionService

logger = logging.getLogger(__name__)

_AGENT_MODEL = 'grok-4-fast-reasoning'

_PRIMARY_AGENT_NAME = 'primary_agent'
_WEB_SEARCH_AGENT_NAME = 'web_search_agent'
_GENERATION_AGENT_NAME = 'generation_agent'


class AgentService:
    """Service for managing AI agents and their interactions."""

    def __init__(self, session_service: SessionService):
        config_path = Path(__file__).parent.parent / 'core' / 'constant' / 'agent_configs.toml'
        with open(config_path, 'rb') as f:
            agent_configs = tomllib.load(f)

        self.primary_agent_config = agent_configs[_PRIMARY_AGENT_NAME]
        self.search_agent_config = agent_configs[_WEB_SEARCH_AGENT_NAME]
        self.generation_agent_config = agent_configs[_GENERATION_AGENT_NAME]
        self.session_service = session_service

    def _render_system_prompts(self) -> tuple[str, str, str]:
        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        primary_prompt = Template(self.primary_agent_config['system_prompt']).render(current_time=current_time)
        search_prompt = Template(self.search_agent_config['system_prompt']).render(current_time=current_time)
        generation_prompt = Template(self.generation_agent_config['system_prompt']).render(current_time=current_time)

        return primary_prompt, search_prompt, generation_prompt

    def _stop_last_step(self, steps: list[ProcessingStep]) -> None:
        if steps and steps[-1].status == 'in_progress':
            steps[-1] = ProcessingStep(
                description=steps[-1].description,
                status='completed',
                timestamp=steps[-1].timestamp,
            )

    async def _run_agent_stream(  # noqa: C901
        self,
        task: str,
        session_history: list[Message] | None = None,
        max_context_turns: int = MAX_SESSION_CONTEXT_TURNS,
    ) -> AsyncIterator[tuple[AgentEventStepNameEnum, str | dict]]:
        """Stream agent execution events including text chunks and tool calls."""
        primary_prompt, search_prompt, generation_prompt = self._render_system_prompts()

        if session_history:
            max_messages = max_context_turns * 2
            limited_history: list[Message] = (
                session_history[-max_messages:] if len(session_history) > max_messages else session_history
            )
        else:
            limited_history = []

        model_client = OpenAIChatCompletionClient(
            base_url='https://api.x.ai/v1',
            model=_AGENT_MODEL,
            api_key=XAI_API_KEY,
            model_info=ModelInfo(
                family='x-ai', vision=True, function_calling=True, json_output=True, structured_output=True
            ),
            timeout=120,
        )

        brave_search_server_params = StdioServerParams(
            command='npx',
            args=[
                '-y',
                '@modelcontextprotocol/server-brave-search',
            ],
            env={
                'BRAVE_API_KEY': BRAVE_SEARCH_API_KEY,
            },
        )

        async with McpWorkbench(brave_search_server_params) as brave_search_mcp:
            web_search_agent = AssistantAgent(
                _WEB_SEARCH_AGENT_NAME,
                description='A web search assistant that can search the web.',
                model_client=model_client,
                system_message=search_prompt,
                model_client_stream=False,
                max_tool_iterations=3,
                workbench=brave_search_mcp,
            )

            web_search_agent_tool = AgentTool(web_search_agent, return_value_as_last_message=True)

            generation_agent = AssistantAgent(
                _GENERATION_AGENT_NAME,
                description='A generation assistant that can generate a summary based on the search results.',
                model_client=model_client,
                system_message=generation_prompt,
                model_client_stream=False,
            )

            generation_agent_tool = AgentTool(generation_agent, return_value_as_last_message=True)

            primary_agent = AssistantAgent(
                _PRIMARY_AGENT_NAME,
                model_client=model_client,
                tools=[web_search_agent_tool, generation_agent_tool],
                system_message=primary_prompt,
                model_client_stream=True,
                max_tool_iterations=10,
            )

            if limited_history:
                history_context = '\n\n'.join(
                    [f'{"User" if msg.role == "user" else "Assistant"}: {msg.content}' for msg in limited_history]
                )
                full_task = f'Previous session:\n{history_context}\n\nCurrent question: {task}'
            else:
                full_task = task

            try:
                async for event in primary_agent.run_stream(task=full_task):
                    if isinstance(event, ModelClientStreamingChunkEvent):
                        yield (AgentEventStepNameEnum.TEXT, event.content)
                    elif isinstance(event, ToolCallRequestEvent):
                        tool_name = event.content[0].name if event.content else 'unknown'
                        try:
                            arguments_json_str = event.content[0].arguments
                            arguments = json.loads(arguments_json_str)
                            task_name = arguments.get('task', 'unknown')
                        except Exception:
                            task_name = 'unknown'
                        yield (AgentEventStepNameEnum.TOOL_CALL, {'tool_name': tool_name, 'task_name': task_name})
                    elif isinstance(event, ToolCallExecutionEvent):
                        yield (AgentEventStepNameEnum.TOOL_RESULT, {})
                    elif isinstance(event, ThoughtEvent):
                        yield (AgentEventStepNameEnum.THOUGHT, event.content)
                    elif isinstance(event, ToolCallSummaryMessage):
                        pass
                    elif isinstance(event, TextMessage):
                        pass
                    elif isinstance(event, TaskResult):
                        pass
                    else:
                        logger.debug(f'Unhandled event type: {type(event).__name__}')
            except Exception as e:
                logger.error(f'Error during agent streaming: {e}', exc_info=True)
                raise

    async def process_query_stream(  # noqa: C901
        self,
        query: str,
        session_id: str,
    ) -> AsyncIterator[tuple[AgentEventTypeEnum, dict]]:
        full_response = ''
        steps: list[ProcessingStep] = []
        current_step: str | None = None

        try:
            await self.session_service.add_user_message(session_id, query)

            session_history = await self.session_service.get_recent_messages(session_id, MAX_SESSION_CONTEXT_TURNS)

            async for event_type, event_data in self._run_agent_stream(
                task=query, session_history=session_history, max_context_turns=MAX_SESSION_CONTEXT_TURNS
            ):
                if event_type == AgentEventStepNameEnum.TOOL_CALL and isinstance(event_data, dict):
                    tool_name = event_data.get('tool_name', 'unknown tool')
                    task_name = event_data.get('task_name', 'unknown task')
                    logger.info(f'Tool call event - tool_name: {tool_name}, task_name: {task_name}')

                    description = None
                    if tool_name == _WEB_SEARCH_AGENT_NAME:
                        if task_name:
                            description = f'Searching the web for "{task_name}"'
                        else:
                            description = 'Searching the web'
                    elif tool_name == _GENERATION_AGENT_NAME:
                        description = 'Generating the summary'
                    else:
                        logger.debug(f'Unknown tool name: {tool_name}')

                    if not description:
                        continue

                    if current_step:
                        self._stop_last_step(steps)
                        yield (AgentEventTypeEnum.STEP, {'description': current_step, 'status': 'completed'})

                    current_step = description
                    steps.append(ProcessingStep(description=description, status='in_progress'))
                    yield (AgentEventTypeEnum.STEP, {'description': description, 'status': 'in_progress'})

                elif event_type == AgentEventStepNameEnum.TOOL_RESULT:
                    if current_step:
                        self._stop_last_step(steps)
                        yield (AgentEventTypeEnum.STEP, {'description': current_step, 'status': 'completed'})
                        current_step = None

                elif event_type == AgentEventStepNameEnum.THOUGHT:
                    logger.info('Thought event received')
                    if current_step:
                        self._stop_last_step(steps)
                        yield (AgentEventTypeEnum.STEP, {'description': current_step, 'status': 'completed'})

                    current_step = 'Thinking...'
                    steps.append(ProcessingStep(description=current_step, status='in_progress'))
                    yield (AgentEventTypeEnum.STEP, {'description': current_step, 'status': 'in_progress'})

                elif event_type == AgentEventStepNameEnum.TEXT and isinstance(event_data, str):
                    chunk = event_data
                    if chunk:
                        full_response += chunk
                        yield (AgentEventTypeEnum.CONTENT, {'content': chunk})

            if current_step:
                self._stop_last_step(steps)
                yield (AgentEventTypeEnum.STEP, {'description': current_step, 'status': 'completed'})

            if full_response:
                await self.session_service.add_assistant_message(session_id, full_response, steps=steps)

            yield (AgentEventTypeEnum.DONE, {})

        except Exception as e:
            logger.error(f'Error in agent query processing: {e}', exc_info=True)

            if current_step:
                self._stop_last_step(steps)
                yield (AgentEventTypeEnum.STEP, {'description': current_step, 'status': 'completed'})

            if full_response:
                error_message = '\n\n[Response was interrupted due to connection issue]'
                await self.session_service.add_assistant_message(session_id, full_response + error_message, steps=steps)
                yield (AgentEventTypeEnum.CONTENT, {'content': error_message})

            yield (AgentEventTypeEnum.ERROR, {'error': 'Connection was interrupted. Please try again.'})
