export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
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
}

export interface TopicSessionHistory {
  id: string;
  turns: TopicSessionHistoryTurn[];
}
