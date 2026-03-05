import { z } from 'zod';
import { SUPPORTED_MODEL_IDS, DEFAULT_MODEL } from './models.js';

// ─── Zod schemas (used by the router for request validation) ─────────────────

export const ZAgentContext = z.object({
  lessonId: z.string().optional(),
  exerciseId: z.string().optional()
});

export const ZAgentHistoryMessage = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string()
});

export const ZAgentChatPayload = z.object({
  message: z.string().min(1).max(4000),
  history: z.array(ZAgentHistoryMessage).max(20).optional(),
  context: ZAgentContext.optional(),
  model: z
    .string()
    .refine((m) => SUPPORTED_MODEL_IDS.has(m), { message: 'Unsupported model' })
    .default(DEFAULT_MODEL)
    .optional()
});

export type TAgentChatPayload = z.infer<typeof ZAgentChatPayload>;
export type TAgentContext = z.infer<typeof ZAgentContext>;
export type TAgentHistoryMessage = z.infer<typeof ZAgentHistoryMessage>;

// ─── Shared types (used by both API and client) ───────────────────────────────

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
  | 'update_question'
  | 'draft_lesson'
  | 'general_chat';

export interface AgentAction {
  type: string;
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
  model?: string;
}

export interface AgentChatResult {
  message: string;
  intent?: string;
  actions?: AgentAction[];
}

/** @deprecated Alias for AgentChatResult — kept for backwards compatibility with @cio/ai-assistant */
export type ChatResponseData = AgentChatResult;

export interface ChatResponse {
  success: true;
  data: AgentChatResult;
}

export interface ChatErrorResponse {
  success: false;
  error: string;
}

export type ChatResult = ChatResponse | ChatErrorResponse;
