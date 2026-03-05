/**
 * @deprecated Use `@cio/agent` directly.
 * This package is kept as a compatibility shim.
 */
export type {
  Message,
  MessageRole,
  SupportedModel,
  IntentType,
  AgentAction,
  AgentContext,
  ChatRequest,
  ChatResponseData,
  ChatResponse,
  ChatErrorResponse,
  ChatResult
} from '@cio/agent';

export { AgentClient } from '@cio/agent';
export type { AgentClientOptions } from '@cio/agent';
