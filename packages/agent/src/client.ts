import type { ChatRequest, ChatResult } from './types.js';

export interface AgentClientOptions {
  /** Base URL of the ClassroomIO API server, e.g. https://api.classroomio.com */
  baseUrl: string;
  /** Returns the current user's access token (or null if not authenticated) */
  getToken: () => Promise<string | null>;
}

/**
 * Browser-safe client for calling the AI agent API.
 * Has no server-only dependencies — safe to import in SvelteKit / React etc.
 */
export class AgentClient {
  constructor(private readonly options: AgentClientOptions) {}

  async chat(courseId: string, payload: ChatRequest): Promise<ChatResult> {
    const token = await this.options.getToken();

    const response = await fetch(
      `${this.options.baseUrl}/course/${courseId}/agent/chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      const text = await response.text().catch(() => 'Unknown error');
      let message = text;
      try {
        const json = JSON.parse(text);
        if (json.error) message = json.error;
      } catch { /* ignore */ }
      return { success: false, error: message };
    }

    return response.json() as Promise<ChatResult>;
  }
}
