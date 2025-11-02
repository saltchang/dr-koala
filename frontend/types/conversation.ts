export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
}

export interface ConversationTurn {
  role: MessageRole;
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  query: string;
  timestamp: string;
}
