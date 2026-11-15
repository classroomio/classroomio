import { generateText } from 'ai';
import { parseMath } from '@cio/question-types/math-engine';
import type { TMathConvertImageBody } from '@cio/utils/validation/math';
import { getVisionModel, getVisionProviderOptions } from './vision-model';

const SYSTEM_PROMPT = [
  'You transcribe math from an image into LaTeX.',
  'Return only the LaTeX of the math, with no $ or \\[ \\] delimiters, no code fences, no explanation and no words around it.',
  'Transcribe exactly what is written, including mistakes. Do not solve, simplify or correct it.',
  'If the image holds several lines of math, join them in reading order with \\\\ inside \\begin{aligned} ... \\end{aligned}.',
  'If the image holds no math, return an empty string.'
].join(' ');

export interface ConvertedMath {
  latex: string;
  mathjson?: unknown;
  valid: boolean;
  parseError?: string;
  usage: { promptTokens: number; completionTokens: number };
  modelName: string;
}

/** Removes the delimiters and code fences a vision model adds despite being told not to. */
export function cleanModelLatex(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:latex|tex)?\s*/i, '')
    .replace(/\s*```$/, '')
    .replace(/^\$\$([\s\S]*)\$\$$/, '$1')
    .replace(/^\$([\s\S]*)\$$/, '$1')
    .replace(/^\\\[([\s\S]*)\\\]$/, '$1')
    .replace(/^\\\(([\s\S]*)\\\)$/, '$1')
    .trim();
}

/**
 * Sends one image to a vision model and checks the returned LaTeX with the Compute Engine.
 * Nothing about the image is kept; callers record the token usage.
 */
export async function convertImageToMath(image: TMathConvertImageBody['image']): Promise<ConvertedMath> {
  const { provider, model, modelName } = getVisionModel();

  const { text, usage } = await generateText({
    model,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [{ type: 'image', image: image.data, mediaType: image.mediaType }]
      }
    ],
    maxOutputTokens: 512,
    maxRetries: 0,
    providerOptions: getVisionProviderOptions(provider)
  });

  const latex = cleanModelLatex(text);
  const usageCounts = { promptTokens: usage.inputTokens ?? 0, completionTokens: usage.outputTokens ?? 0 };
  if (!latex) {
    return { latex, valid: false, parseError: 'NO_MATH_FOUND', usage: usageCounts, modelName };
  }

  const parsed = parseMath(latex);
  if (!parsed) {
    return { latex, valid: false, parseError: 'PARSE_FAILED', usage: usageCounts, modelName };
  }

  return { latex, mathjson: parsed.raw, valid: true, usage: usageCounts, modelName };
}
