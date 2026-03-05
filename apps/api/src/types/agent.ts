import { z } from 'zod';

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
  context: ZAgentContext.optional()
});

export type TAgentChatPayload = z.infer<typeof ZAgentChatPayload>;
export type TAgentContext = z.infer<typeof ZAgentContext>;
export type TAgentHistoryMessage = z.infer<typeof ZAgentHistoryMessage>;

export interface AgentAction {
  type: string;
  description: string;
  result?: unknown;
}

export interface AgentChatResult {
  message: string;
  intent?: string;
  actions?: AgentAction[];
}
