import tomllib
from collections.abc import AsyncIterator
from datetime import datetime
from pathlib import Path

from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.messages import ModelClientStreamingChunkEvent
from autogen_agentchat.tools import AgentTool
from autogen_core.models import ModelInfo
from autogen_ext.models.openai import OpenAIChatCompletionClient
from autogen_ext.tools.mcp import McpWorkbench, StdioServerParams
from jinja2 import Template

from config.settings import BRAVE_SEARCH_API_KEY, XAI_API_KEY


class AgentService:
    """Service for managing AI agents and their interactions."""

    def __init__(self):
        """Initialize agent configurations."""
        config_path = Path(__file__).parent.parent / 'core' / 'constant' / 'agent_configs.toml'
        with open(config_path, 'rb') as f:
            agent_configs = tomllib.load(f)

        self.primary_agent_config = agent_configs['primary_agent']
        self.search_agent_config = agent_configs['search_agent']
        self.generation_agent_config = agent_configs['generation_agent']

    def _render_system_prompts(self) -> tuple[str, str, str]:
        """Render system prompts with current time."""
        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        primary_prompt = Template(self.primary_agent_config['system_prompt']).render(current_time=current_time)
        search_prompt = Template(self.search_agent_config['system_prompt']).render(current_time=current_time)
        generation_prompt = Template(self.generation_agent_config['system_prompt']).render(current_time=current_time)

        return primary_prompt, search_prompt, generation_prompt

    async def run_agent_stream(self, task: str) -> AsyncIterator[str]:
        """
        Run the multi-agent system with streaming response.

        Args:
            task: The user's question or task

        Yields:
            Streaming text chunks from the agents
        """
        primary_prompt, search_prompt, generation_prompt = self._render_system_prompts()

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

            async for event in primary_agent.run_stream(task=task):
                if isinstance(event, ModelClientStreamingChunkEvent):
                    yield event.content
