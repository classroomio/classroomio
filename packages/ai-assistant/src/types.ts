export type MessageRole = 'user' | 'assistant';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
}

export type IntentType =
  | 'update_lesson_text'
  | 'generate_questions'
  | 'draft_lesson'
  | 'general_chat';

export interface AgentAction {
  type: IntentType | string;
  description: string;
  result?: unknown;
}

export interface AgentContext {
  lessonId?: string;
  exerciseId?: string;
}

export interface ChatRequest {
  message: string;
  history?: Pick<Message, 'role' | 'content'>[];
  context?: AgentContext;
}

export interface ChatResponseData {
  message: string;
  intent?: string;
  actions?: AgentAction[];
}

export interface ChatResponse {
  success: true;
  data: ChatResponseData;
}

export interface ChatErrorResponse {
  success: false;
  error: string;
}

export type ChatResult = ChatResponse | ChatErrorResponse;
