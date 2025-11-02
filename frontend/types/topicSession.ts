export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
}

export interface ProcessingStep {
  description: string;
  status: 'in_progress' | 'completed';
  timestamp?: string;
}

export interface TopicSessionTurn {
  role: MessageRole;
  content: string;
  timestamp: string;
}

export interface TopicSession {
  id: string;
  query: string;
  timestamp: string;
}

interface TopicSessionHistoryTurn {
  query: string;
  response: string;
  timestamp: string;
  sources?: string[];
  steps?: ProcessingStep[];
}

export interface TopicSessionHistory {
  id: string;
  turns: TopicSessionHistoryTurn[];
}
