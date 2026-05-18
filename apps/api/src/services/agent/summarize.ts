import { generateText } from 'ai';
import { createModel, pickAnyConfiguredProvider } from '@cio/ai-assistant/providers';
import { AppError } from '@api/utils/errors';

const SUMMARIZE_SYSTEM_PROMPT = `You are summarizing a multi-turn ClassroomIO course-creation chat so the assistant can pick up exactly where it left off in a new conversation.

Write the summary as a first-person user message to the assistant. It must be DETAILED — assume the receiving assistant has zero prior context.

Required structure (use these exact section headings, written in plain text without markdown):

1. Course context: course title, intended audience, primary outcomes, and the active template flow (Product 101, Product Onboarding, Expert on X, or other) if any.
2. Template form answers: every answered field by key and value, including the chosen depth tier (light / balanced / deep_doc) and any documentation URL provided.
3. Documentation fetched: list every URL that was fetched via fetch_documentation_url and a one-line note on what was learned from each (key product surface area, vocabulary, workflows). Do NOT skip this section if any docs were fetched.
4. Plan status: whether a course plan has been generated, the plan title and section count, and whether it was approved, edited, or still pending changes.
5. Implementation progress: which sections / lessons / exercises were already created (by title), and any tool errors hit.
6. Open decisions: anything the teacher said they still wanted to do, change, or get an answer on.
7. Continue by: an explicit next action for the assistant (e.g. "Fetch the remaining linked docs and then call generate_course_plan", or "Resume implementing from section 4").

Length target: at least 250 words; expand as needed to capture detail. Do not write a high-level paragraph; write the structured handoff above. Never abbreviate or omit sections — write "(none)" if a section is empty.`;

interface InboundMessagePart {
  type: string;
  text?: string;
  toolName?: string;
  state?: string;
  input?: unknown;
  output?: unknown;
}

interface InboundMessage {
  role: string;
  content?: string;
  parts?: InboundMessagePart[];
  metadata?: Record<string, unknown> | null | undefined;
}

export interface SummarizeOptions {
  messages: InboundMessage[];
}

function truncate(input: string, max: number): string {
  if (input.length <= max) return input;

  return `${input.slice(0, max)}…`;
}

function stringifySafely(value: unknown): string {
  try {
    return typeof value === 'string' ? value : JSON.stringify(value);
  } catch {
    return '[unserializable]';
  }
}

function partsToText(message: InboundMessage): string {
  const lines: string[] = [];

  if (message.content && message.content.trim().length > 0) {
    lines.push(message.content.trim());
  }

  for (const part of message.parts ?? []) {
    if (part.type === 'text' && part.text) {
      lines.push(part.text.trim());
      continue;
    }

    if (part.type === 'tool-invocation' || part.type?.startsWith('tool-')) {
      const toolName = part.toolName ?? (part.type.startsWith('tool-') ? part.type.slice(5) : 'unknown_tool');

      const inputText = part.input !== undefined ? truncate(stringifySafely(part.input), 600) : '';
      const outputText = part.output !== undefined ? truncate(stringifySafely(part.output), 1500) : '';

      const segments: string[] = [`[tool:${toolName}]`];

      if (inputText) {
        segments.push(`input=${inputText}`);
      }

      if (outputText) {
        segments.push(`output=${outputText}`);
      }

      lines.push(segments.join(' '));
    }
  }

  const metadataTemplate = message.metadata?.template;

  if (metadataTemplate && typeof metadataTemplate === 'object') {
    lines.push(`[template-action] ${truncate(stringifySafely(metadataTemplate), 600)}`);
  }

  return lines.join('\n');
}

const MAX_CONVERSATION_CHARS = 60_000;
const MAX_OUTPUT_TOKENS = 2_000;

export async function summarizeConversation(options: SummarizeOptions): Promise<string> {
  const providerConfig = pickAnyConfiguredProvider();

  if (!providerConfig) {
    throw new AppError('AI assistant is not configured', 'AI_NOT_CONFIGURED', 503);
  }

  const model = createModel(providerConfig);

  const conversationLines: string[] = [];

  for (const message of options.messages ?? []) {
    const role = message.role === 'user' ? 'User' : 'Assistant';
    const body = partsToText(message);

    if (!body.trim()) {
      continue;
    }

    conversationLines.push(`${role}: ${body}`);
  }

  const conversationText = conversationLines.join('\n\n');

  // Prefer keeping the END of the transcript when truncating — recent context is most
  // valuable for "continue from here" continuations.
  const truncatedText =
    conversationText.length > MAX_CONVERSATION_CHARS
      ? conversationText.slice(conversationText.length - MAX_CONVERSATION_CHARS)
      : conversationText;

  const result = await generateText({
    model,
    system: SUMMARIZE_SYSTEM_PROMPT,
    prompt: `Here is the conversation to summarize. Tool calls appear as [tool:name] input=… output=… lines.\n\n${truncatedText}\n\nReturn the structured handoff message described in the system prompt.`,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    maxRetries: 0
  });

  return result.text.trim();
}
