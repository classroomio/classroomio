import { generateObject } from 'ai';
import * as z from 'zod';
import { createModel, pickAnyConfiguredProvider } from '@cio/ai-assistant/providers';
import { AppError, ErrorCodes } from '@cio/utils/errors';

const MAX_NOTE_CHARS = 24_000;
const MAX_SEGMENTS = 8;

const noteCommentReviewSchema = z.object({
  comments: z
    .array(
      z.object({
        quotedText: z.string().min(1).max(500).describe('Exact contiguous substring copied from the note plain text'),
        body: z.string().min(1).max(800).describe('Concise, actionable feedback about the quoted passage')
      })
    )
    .max(MAX_SEGMENTS)
});

export type NoteAiCommentSuggestion = z.infer<typeof noteCommentReviewSchema>['comments'][number];

function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function truncate(input: string, max: number): string {
  if (input.length <= max) {
    return input;
  }

  return `${input.slice(0, max)}…`;
}

export async function generateNoteAiCommentSuggestions(params: {
  noteHtml: string;
  docTitle?: string | null;
  focusQuotedText?: string | null;
}): Promise<NoteAiCommentSuggestion[]> {
  const providerConfig = pickAnyConfiguredProvider();

  if (!providerConfig) {
    throw new AppError('AI assistant is not configured', ErrorCodes.AI_NOT_CONFIGURED, 503);
  }

  const plainText = htmlToPlainText(params.noteHtml);

  if (!plainText) {
    return [];
  }

  const model = createModel(providerConfig);
  const focus = params.focusQuotedText?.trim();
  const system = `You are an editor reviewing a ClassroomIO workspace note for an instructor.
Return short, constructive inline comments anchored to exact passages.
Rules:
- quotedText MUST be copied exactly from the note plain text (contiguous substring).
- Prefer 2–${MAX_SEGMENTS} high-signal comments; fewer is fine if the note is short.
- Do not invent quotes that are not present.
- Focus on clarity, structure, missing detail, and learner usefulness.
- Comment bodies should be plain text, no markdown headings.`;

  const promptParts = [
    params.docTitle?.trim() ? `Note title: ${params.docTitle.trim()}` : null,
    focus ? `Focus especially on this selected passage:\n"""${focus}"""` : 'Review the full note.',
    'Note plain text:',
    truncate(plainText, MAX_NOTE_CHARS)
  ].filter(Boolean);

  const { object } = await generateObject({
    model,
    schema: noteCommentReviewSchema,
    schemaName: 'NoteCommentReview',
    schemaDescription: 'Inline AI comments for a workspace note',
    system,
    prompt: promptParts.join('\n\n'),
    maxRetries: 0
  });

  const unique: NoteAiCommentSuggestion[] = [];
  const seen = new Set<string>();

  for (const comment of object.comments) {
    const quotedText = comment.quotedText.trim();
    const body = comment.body.trim();

    if (!quotedText || !body || !plainText.includes(quotedText)) {
      continue;
    }

    const key = quotedText.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push({ quotedText, body });

    if (unique.length >= MAX_SEGMENTS) {
      break;
    }
  }

  return unique;
}
