/**
 * Tinybird event tracking for AI assistant observability.
 * Fire-and-forget: never blocks the agent, silently skipped when not configured.
 */

const TINYBIRD_TOKEN = process.env.TINYBIRD_TOKEN;
const TINYBIRD_BASE_URL = process.env.TINYBIRD_BASE_URL || 'https://api.tinybird.co';

/**
 * Send an event to Tinybird for analytics and debugging.
 * Safe to call without awaiting — errors are swallowed.
 */
export function trackAgentEvent(eventName: string, data: Record<string, unknown>): void {
  if (!TINYBIRD_TOKEN) return;

  fetch(`${TINYBIRD_BASE_URL}/v0/events?name=${eventName}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TINYBIRD_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ...data, timestamp: new Date().toISOString() })
  }).catch(() => {
    // Intentionally swallowed — observability must never break the agent
  });
}

// ─── Event Names ─────────────────────────────────────────────────────────────

export const AgentEvent = {
  CHAT_STARTED: 'agent.chat.started',
  CHAT_COMPLETED: 'agent.chat.completed',
  CHAT_ERROR: 'agent.chat.error',
  TOOL_CALLED: 'agent.tool.called',
  TOOL_COMPLETED: 'agent.tool.completed',
  TOOL_FAILED: 'agent.tool.failed',
  DOCUMENT_UPLOADED: 'agent.document.uploaded',
  PLAN_GENERATED: 'agent.plan.generated',
  PLAN_EXECUTED: 'agent.plan.executed'
} as const;
