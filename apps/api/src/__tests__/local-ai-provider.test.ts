import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateText } from 'ai';

import { createModel, pickAnyConfiguredProvider } from '../../../../packages/ai-assistant/src/providers';

const environmentKeys = ['OPENAI_API_KEY', 'OPENAI_BASE_URL', 'OPENAI_MODEL', 'GOOGLE_API_KEY'] as const;
const originalEnvironment = Object.fromEntries(environmentKeys.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of environmentKeys) {
    const originalValue = originalEnvironment[key];
    if (originalValue === undefined) delete process.env[key];
    else process.env[key] = originalValue;
  }

  vi.unstubAllGlobals();
});

describe('local OpenAI-compatible provider configuration', () => {
  it('does not alter generic provider selection or model creation', async () => {
    process.env.OPENAI_API_KEY = 'local-test-key';
    process.env.OPENAI_BASE_URL = 'http://localhost:20128/v1';
    process.env.OPENAI_MODEL = 'kr/claude-sonnet-4.5';
    process.env.GOOGLE_API_KEY = 'google-test-key';

    let requestUrl = '';
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        requestUrl = String(input);
        return new Response(JSON.stringify({ error: { message: 'unauthorized' } }), {
          status: 401,
          headers: { 'content-type': 'application/json' }
        });
      })
    );

    expect(pickAnyConfiguredProvider()).toMatchObject({ provider: 'google', apiKey: 'google-test-key' });
    await expect(
      generateText({
        model: createModel({ provider: 'openai', apiKey: 'local-test-key' }),
        prompt: 'Reply with ok.',
        maxRetries: 0
      })
    ).rejects.toThrow();
    expect(requestUrl).toBe('https://api.openai.com/v1/responses');
  });

  it('uses the configured base URL and model with the Chat Completions API', async () => {
    process.env.OPENAI_BASE_URL = 'http://localhost:20128/v1';
    process.env.OPENAI_MODEL = 'kr/claude-sonnet-4.5';

    let requestUrl = '';
    let authorization = '';
    let requestedModel = '';
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        requestUrl = String(input);
        authorization = new Headers(init?.headers).get('authorization') ?? '';
        requestedModel = String(JSON.parse(String(init?.body)).model);

        return new Response(
          JSON.stringify({
            id: 'chatcmpl-local-test',
            object: 'chat.completion',
            created: 1_792_664_400,
            model: requestedModel,
            choices: [{ index: 0, message: { role: 'assistant', content: 'ok' }, finish_reason: 'stop' }],
            usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 }
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      })
    );

    let result: Awaited<ReturnType<typeof generateText>> | undefined;
    let generationError: unknown;
    try {
      result = await generateText({
        model: createModel({ provider: 'openai', apiKey: 'local-test-key' }, { useOpenAICompatibleEnvironment: true }),
        prompt: 'Reply with ok.',
        maxRetries: 0
      });
    } catch (error) {
      generationError = error;
    }

    expect(requestUrl).toBe('http://localhost:20128/v1/chat/completions');
    expect(requestedModel).toBe('kr/claude-sonnet-4.5');
    expect(authorization).toBe('Bearer local-test-key');
    expect(generationError).toBeUndefined();
    expect(result?.text).toBe('ok');
  });

  it('opts into OpenAI when a custom OpenAI base URL is configured', () => {
    process.env.OPENAI_API_KEY = 'local-test-key';
    process.env.OPENAI_BASE_URL = 'http://localhost:20128/v1';
    process.env.GOOGLE_API_KEY = 'google-test-key';

    expect(pickAnyConfiguredProvider({ useOpenAICompatibleEnvironment: true })).toMatchObject({
      provider: 'openai',
      apiKey: 'local-test-key'
    });
  });

  it('does not apply the OpenAI model override to other providers', () => {
    process.env.OPENAI_MODEL = 'kr/claude-sonnet-4.5';

    const model = createModel({ provider: 'google', apiKey: 'google-test-key' });

    expect(model).toMatchObject({ modelId: 'gemini-3.1-flash-lite' });
  });
});
