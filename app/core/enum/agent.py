from enum import StrEnum


class AgentEventTypeEnum(StrEnum):
    CONTENT = 'content'
    STEP = 'step'
    DONE = 'done'
    ERROR = 'error'


class AgentEventStepNameEnum(StrEnum):
    TEXT = 'text'
    TOOL_CALL = 'tool_call'
    TOOL_RESULT = 'tool_result'
    THOUGHT = 'thought'
