import type { ProgressStep } from './tool-labels';

export interface AgentToolPart {
  type: string;
  state?: string;
  input?: unknown;
  output?: unknown;
  errorText?: string;
  toolInvocation?: {
    toolName?: string;
    result?: unknown;
  };
}

export function isAgentToolPart(part: Record<string, unknown>): part is AgentToolPart {
  if (part.type === 'tool-invocation') {
    return true;
  }

  return typeof part.type === 'string' && part.type.startsWith('tool-');
}

export function getAgentToolName(part: AgentToolPart): string | null {
  if (part.type === 'tool-invocation') {
    return part.toolInvocation?.toolName ?? null;
  }

  if (!part.type.startsWith('tool-')) {
    return null;
  }

  return part.type.slice(5);
}

export function getAgentToolResult(part: AgentToolPart): unknown {
  if (part.type === 'tool-invocation') {
    return part.toolInvocation?.result;
  }

  return part.output;
}

export function getAgentToolStatus(part: AgentToolPart): ProgressStep['status'] {
  if (part.state === 'result' || part.state === 'output-available') {
    return 'completed';
  }

  if (part.state === 'output-error') {
    return 'failed';
  }

  if (
    part.state === 'call' ||
    part.state === 'partial-call' ||
    part.state === 'input-streaming' ||
    part.state === 'input-available'
  ) {
    return 'in_progress';
  }

  return 'pending';
}
