import asyncio
import tomllib
from datetime import datetime
from pathlib import Path

from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.tools import AgentTool
from autogen_agentchat.ui import Console
from autogen_core.models import ModelInfo
from autogen_ext.models.openai import OpenAIChatCompletionClient
from autogen_ext.tools.mcp import McpWorkbench, StdioServerParams
from jinja2 import Template

from config.settings import BRAVE_SEARCH_API_KEY, XAI_API_KEY


async def main() -> None:
    config_path = Path(__file__).parent / 'core' / 'constant' / 'agent_configs.toml'
    with open(config_path, 'rb') as f:
        agent_configs = tomllib.load(f)

    primary_agent_config = agent_configs['primary_agent']
    search_agent_config = agent_configs['search_agent']
    generation_agent_config = agent_configs['generation_agent']

    primary_agent_system_prompt = primary_agent_config['system_prompt']
    search_agent_system_prompt_template = search_agent_config['system_prompt']
    generation_agent_system_prompt_template = generation_agent_config['system_prompt']

    primary_agent_system_prompt = Template(primary_agent_system_prompt).render(
        current_time=datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    )
    search_agent_system_prompt = Template(search_agent_system_prompt_template).render(
        current_time=datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    )
    generation_agent_system_prompt = Template(generation_agent_system_prompt_template).render(
        current_time=datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    )

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
            system_message=search_agent_system_prompt,
            model_client_stream=True,
            workbench=brave_search_mcp,
        )

        web_search_agent_tool = AgentTool(web_search_agent, return_value_as_last_message=True)

        generation_agent = AssistantAgent(
            'generation_agent',
            description='A generation assistant that can generate a summary based on the search results.',
            model_client=model_client,
            system_message=generation_agent_system_prompt,
            model_client_stream=True,
            workbench=brave_search_mcp,
        )

        generation_agent_tool = AgentTool(generation_agent, return_value_as_last_message=True)

        primary_agent = AssistantAgent(
            'primary_agent',
            model_client=model_client,
            tools=[web_search_agent_tool, generation_agent_tool],
            system_message=primary_agent_system_prompt,
            model_client_stream=True,
            max_tool_iterations=20,
        )

        await Console(primary_agent.run_stream(task='今天的台股加權指數多少'))


if __name__ == '__main__':
    asyncio.run(main())
