import asyncio
import tomllib
from datetime import datetime
from pathlib import Path

from autogen_agentchat.agents import AssistantAgent
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

    search_agent_config = agent_configs['search_and_analysis_agent']
    system_prompt_template = search_agent_config['system_prompt']

    search_agent_system_prompt = Template(system_prompt_template).render(
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
        search_agent = AssistantAgent(
            'web_search_assistant',
            model_client=model_client,
            workbench=brave_search_mcp,
            model_client_stream=False,
            max_tool_iterations=5,
            system_message=search_agent_system_prompt,
        )

        await Console(search_agent.run_stream(task='今天的台股加權指數多少'))


if __name__ == '__main__':
    asyncio.run(main())
