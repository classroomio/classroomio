import OpenAI from 'openai';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

let _client: OpenAI | null = null;

export function initLlm(apiKey: string): void {
  _client = new OpenAI({
    apiKey,
    baseURL: OPENROUTER_BASE_URL,
    defaultHeaders: {
      'HTTP-Referer': 'https://classroomio.com',
      'X-Title': 'ClassroomIO AI Course Assistant'
    }
  });
}

export function getLlm(): OpenAI {
  if (!_client) {
    throw new Error(
      '@cio/agent: LLM client not initialised — call createAgentRouter() before handling requests'
    );
  }
  return _client;
}
