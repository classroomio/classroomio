/** `message` is the server's error text, or null when it sent none. */
export type TutorStreamEvent =
  | { type: 'text'; delta: string }
  | { type: 'error'; message: string | null }
  | { type: 'finish' };

function parseChunk(data: string): TutorStreamEvent | null {
  if (data === '[DONE]') return { type: 'finish' };

  let chunk: unknown;
  try {
    chunk = JSON.parse(data);
  } catch {
    return null;
  }

  if (typeof chunk !== 'object' || chunk === null) return null;

  const record = chunk as Record<string, unknown>;
  if (record.type === 'text-delta' && typeof record.delta === 'string') return { type: 'text', delta: record.delta };
  if (record.type === 'error')
    return { type: 'error', message: typeof record.errorText === 'string' ? record.errorText : null };
  if (record.type === 'finish') return { type: 'finish' };

  return null;
}

/** Reads an AI SDK UI message stream (server-sent events) and reports text deltas, errors and the finish. */
export async function readUiMessageStream(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: TutorStreamEvent) => void
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const flush = (block: string) => {
    const data = block
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trimStart())
      .join('\n');
    if (!data) return;

    const event = parseChunk(data);
    if (event) onEvent(event);
  };

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');

    let boundary = buffer.indexOf('\n\n');
    while (boundary !== -1) {
      flush(buffer.slice(0, boundary));
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf('\n\n');
    }
  }

  if (buffer.trim()) flush(buffer);
}
