import logging
import tomllib
from collections.abc import AsyncIterator
from datetime import datetime
from pathlib import Path
from typing import Literal

from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.messages import ModelClientStreamingChunkEvent
from autogen_agentchat.tools import AgentTool
from autogen_core.models import ModelInfo
from autogen_ext.models.openai import OpenAIChatCompletionClient
from autogen_ext.tools.mcp import McpWorkbench, StdioServerParams
from jinja2 import Template

from config.settings import BRAVE_SEARCH_API_KEY, MAX_SESSION_CONTEXT_TURNS, XAI_API_KEY
from core.model.session import Message
from service.session import SessionService

logger = logging.getLogger(__name__)


class AgentService:
    """Service for managing AI agents and their interactions."""

    def __init__(self, session_service: SessionService):
        config_path = Path(__file__).parent.parent / 'core' / 'constant' / 'agent_configs.toml'
        with open(config_path, 'rb') as f:
            agent_configs = tomllib.load(f)

        self.primary_agent_config = agent_configs['primary_agent']
        self.search_agent_config = agent_configs['search_agent']
        self.generation_agent_config = agent_configs['generation_agent']
        self.session_service = session_service

    def _render_system_prompts(self) -> tuple[str, str, str]:
        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        primary_prompt = Template(self.primary_agent_config['system_prompt']).render(current_time=current_time)
        search_prompt = Template(self.search_agent_config['system_prompt']).render(current_time=current_time)
        generation_prompt = Template(self.generation_agent_config['system_prompt']).render(current_time=current_time)

        return primary_prompt, search_prompt, generation_prompt

    async def run_agent_stream(
        self,
        task: str,
        session_history: list[Message] | None = None,
        max_context_turns: int = MAX_SESSION_CONTEXT_TURNS,
    ) -> AsyncIterator[str]:
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
            model='grok-4-fast-reasoning',
            api_key=XAI_API_KEY,
            model_info=ModelInfo(
                family='x-ai', vision=True, function_calling=True, json_output=True, structured_output=True
            ),
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
                'web_search_assistant',
                description='A web search assistant that can search the web.',
                model_client=model_client,
                system_message=search_prompt,
                model_client_stream=True,
                workbench=brave_search_mcp,
            )

            web_search_agent_tool = AgentTool(web_search_agent, return_value_as_last_message=True)

            generation_agent = AssistantAgent(
                'generation_agent',
                description='A generation assistant that can generate a summary based on the search results.',
                model_client=model_client,
                system_message=generation_prompt,
                model_client_stream=True,
                workbench=brave_search_mcp,
            )

            generation_agent_tool = AgentTool(generation_agent, return_value_as_last_message=True)

            primary_agent = AssistantAgent(
                'primary_agent',
                model_client=model_client,
                tools=[web_search_agent_tool, generation_agent_tool],
                system_message=primary_prompt,
                model_client_stream=True,
                max_tool_iterations=20,
            )

            if limited_history:
                history_context = '\n\n'.join(
                    [f'{"User" if msg.role == "user" else "Assistant"}: {msg.content}' for msg in limited_history]
                )
                full_task = f'Previous session:\n{history_context}\n\nCurrent question: {task}'
            else:
                full_task = task

            async for event in primary_agent.run_stream(task=full_task):
                if isinstance(event, ModelClientStreamingChunkEvent):
                    yield event.content

    async def process_query_stream(
        self,
        query: str,
        session_id: str | None = None,
    ) -> AsyncIterator[tuple[Literal['session_id', 'content', 'done', 'error'], dict]]:
        try:
            session = self.session_service.get_session(session_id) if session_id else None

            if not session:
                session = self.session_service.create_session()

            session_id = session.session_id

            yield ('session_id', {'session_id': session_id})

            self.session_service.add_user_message(session_id, query)

            session_history = self.session_service.get_recent_messages(session_id, MAX_SESSION_CONTEXT_TURNS)

            full_response = ''
            async for chunk in self.run_agent_stream(
                task=query, session_history=session_history, max_context_turns=MAX_SESSION_CONTEXT_TURNS
            ):
                if chunk:
                    full_response += chunk
                    yield ('content', {'content': chunk})

            self.session_service.add_assistant_message(session_id, full_response)

            yield ('done', {})

        except Exception as e:
            logger.error(f'Error in agent query processing: {e}', exc_info=True)
            yield ('error', {'error': str(e)})
