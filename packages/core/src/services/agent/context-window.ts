const MAX_MESSAGES = 20;
const KEEP_RECENT = 16;
const MAX_TOOL_OUTPUT_CHARS = 2000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function trimToolOutputs(messages: any[]): any[] {
  return messages.map((message) => {
    if (!Array.isArray(message.parts)) return message;

    const trimmedParts = message.parts.map((part: any) => {
      if (part.state !== 'output-available' || part.output == null) return part;

      const serialized = typeof part.output === 'string' ? part.output : JSON.stringify(part.output);
      if (serialized.length <= MAX_TOOL_OUTPUT_CHARS) return part;

      const truncated = serialized.slice(0, MAX_TOOL_OUTPUT_CHARS) + '…[truncated]';
      return { ...part, output: truncated };
    });

    if (trimmedParts === message.parts) return message;

    return { ...message, parts: trimmedParts };
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function trimMessageHistory(messages: any[]): any[] {
  const countTrimmed = messages.length <= MAX_MESSAGES ? messages : [messages[0], ...messages.slice(-KEEP_RECENT)];

  return trimToolOutputs(countTrimmed);
}
