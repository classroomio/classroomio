import { generateText } from 'ai';
import { AIProvider, type AIProviderConfig, createModel } from '@cio/ai-assistant';
import { AGENT_MODELS } from '@cio/utils/agent-models';
import { HTML_BLOCK_MAX_LENGTH } from '@cio/utils/validation/block';
import { getLessonById } from '@cio/db/queries/lesson';
import { AppError, ErrorCodes } from '@api/utils/errors';

const HTML_MODELS: Record<AIProvider, string> = {
  [AIProvider.OPENAI]: AGENT_MODELS['gpt-5.4-mini'].backendModelId,
  [AIProvider.ANTHROPIC]: AGENT_MODELS['claude-sonnet-3-5'].backendModelId,
  [AIProvider.GOOGLE]: AGENT_MODELS['gemini-3.1-flash-lite'].backendModelId,
  [AIProvider.MOONSHOT]: AGENT_MODELS['kimi-k2.6'].backendModelId
};

const MAX_OUTPUT_TOKENS = 32_000;

const SYSTEM_PROMPT = [
  'You build one interactive HTML page that a teacher embeds inside a lesson on an online course platform.',
  'Return a single complete, self-contained HTML document that starts with <!doctype html>.',
  'Put all CSS in <style> tags and all JavaScript in <script> tags. Do not load external scripts, stylesheets, fonts or images; use inline SVG or CSS for visuals.',
  'The page renders in a sandboxed iframe with no access to cookies, storage, the network or the parent page, so never rely on localStorage, fetch or window.parent.',
  'Make it responsive from 320px wide, readable, accessible, and polished, with a light background unless the request asks otherwise.',
  'Use realistic sample content that fits the request and label sample data as such.',
  'Return only the HTML document, with no markdown code fences and no explanation.'
].join(' ');

export interface GenerateHtmlResult {
  html: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  modelName: string;
}

/**
 * Strips a markdown code fence a model wraps around the document, if any.
 */
function unwrapCodeFence(text: string): string {
  const trimmed = text.trim();
  const fenced = /^```(?:html)?\s*\n([\s\S]*?)\n?```$/i.exec(trimmed);

  return fenced ? fenced[1].trim() : trimmed;
}

function buildPrompt(prompt: string, lessonTitle: string, currentHtml: string | undefined): string {
  const lessonLine = `The page goes in a lesson titled "${lessonTitle}".`;
  if (!currentHtml) return [lessonLine, prompt].join('\n');

  return [
    lessonLine,
    'Here is the current HTML document:',
    '<current_html>',
    currentHtml,
    '</current_html>',
    'Rewrite the whole document to apply this change, keeping everything else as it is:',
    prompt
  ].join('\n');
}

/**
 * Generates a self-contained HTML document for a lesson from a prompt, or rewrites `currentHtml` to apply it.
 * Throws AI_EMPTY_RESPONSE when the model returns nothing usable and HTML_TOO_LARGE when the page exceeds the block limit.
 */
export async function generateHtmlDocument(
  lessonId: string,
  prompt: string,
  currentHtml: string | undefined,
  providerConfig: AIProviderConfig
): Promise<GenerateHtmlResult> {
  const lesson = await getLessonById(lessonId);
  if (!lesson) {
    throw new AppError('Lesson not found', ErrorCodes.LESSON_NOT_FOUND, 404);
  }

  const modelName = HTML_MODELS[providerConfig.provider];
  const model = createModel({ ...providerConfig, model: modelName });
  const userPrompt = buildPrompt(prompt, lesson.title ?? '', currentHtml);

  const { text, usage } = await generateText({
    model,
    system: SYSTEM_PROMPT,
    prompt: userPrompt,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    maxRetries: 0
  });

  const html = unwrapCodeFence(text);
  if (!html) {
    throw new AppError('The AI returned an empty page', 'AI_EMPTY_RESPONSE', 502);
  }

  if (html.length > HTML_BLOCK_MAX_LENGTH) {
    throw new AppError('The generated page is too large', 'HTML_TOO_LARGE', 422);
  }

  return {
    html,
    usage: {
      promptTokens: usage.inputTokens ?? 0,
      completionTokens: usage.outputTokens ?? 0,
      totalTokens: usage.totalTokens ?? 0
    },
    modelName
  };
}
