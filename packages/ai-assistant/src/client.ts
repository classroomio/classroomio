import type { ChatRequest, ChatResult } from './types';

export interface AgentClientOptions {
  baseUrl: string;
  getToken: () => Promise<string | null>;
}

export class AgentClient {
  constructor(private options: AgentClientOptions) {}

  async chat(courseId: string, payload: ChatRequest): Promise<ChatResult> {
    const token = await this.options.getToken();

    const response = await fetch(`${this.options.baseUrl}/course/${courseId}/agent/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const text = await response.text().catch(() => 'Unknown error');
      return { success: false, error: text };
    }

    return response.json() as Promise<ChatResult>;
  }
}
