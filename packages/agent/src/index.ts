// ─── Server-side exports (API / Node.js only) ─────────────────────────────────

export { createAgentRouter } from './router.js';
export type { AgentRouterConfig } from './router.js';

export { processAgentChat } from './service.js';

export { initDb, getDb } from './db.js';
export { initLlm, getLlm } from './llm.js';

export { AGENT_TOOLS } from './tools.js';

export {
  createAuthMiddleware,
  createCourseTeamMemberMiddleware
} from './middleware.js';
export type { AgentVariables } from './middleware.js';

// ─── Shared exports (safe for any environment) ────────────────────────────────

export {
  SUPPORTED_MODELS,
  DEFAULT_MODEL,
  SUPPORTED_MODEL_IDS
} from './models.js';
export type { SupportedModel } from './models.js';

export {
  ZAgentChatPayload,
  ZAgentContext,
  ZAgentHistoryMessage
} from './types.js';
export type {
  TAgentChatPayload,
  TAgentContext,
  TAgentHistoryMessage,
  MessageRole,
  Message,
  IntentType,
  AgentAction,
  AgentContext,
  ChatRequest,
  AgentChatResult,
  ChatResponseData,
  ChatResponse,
  ChatErrorResponse,
  ChatResult
} from './types.js';

// ─── Client exports (browser-safe) ───────────────────────────────────────────

export { AgentClient } from './client.js';
export type { AgentClientOptions } from './client.js';
