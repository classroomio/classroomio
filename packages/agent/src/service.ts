import type OpenAI from 'openai';
import { getDb } from './db.js';
import { getLlm } from './llm.js';
import { AGENT_TOOLS, execUpdateLessonText, execGenerateQuestions, execUpdateQuestion, execDraftLesson } from './tools.js';
import { DEFAULT_MODEL, SUPPORTED_MODEL_IDS } from './models.js';
import type { TAgentChatPayload, AgentChatResult } from './types.js';

const QUESTION_TYPE_LABELS: Record<string, string> = {
  RADIO: 'Single answer (one correct option, radio button)',
  CHECKBOX: 'Multiple answers (multiple correct options, checkboxes)',
  TEXTAREA: 'Paragraph (open-ended free-text, no auto-grading)'
};

function buildSystemPrompt(courseTitle: string, lessonTitle: string, lessonNote: string): string {
  let prompt = `You are an AI assistant for educators using ClassroomIO LMS. You help teachers author and improve course content.

Course: "${courseTitle}"`;

  if (lessonTitle) prompt += `\nLesson: "${lessonTitle}"`;

  if (lessonNote) {
    const text = lessonNote.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 3000);
    prompt += `\n\nLesson content:\n${text}`;
  }

  prompt += `

Question types:
${Object.entries(QUESTION_TYPE_LABELS).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

You can:
- Answer questions about course design and pedagogy
- Update the current lesson text (update_lesson_text)
- Generate quiz questions with the right type (generate_questions)
- Update an existing question (update_question)
- Draft a new lesson (draft_lesson)

For HTML content use clean semantic markup — no inline CSS.`;

  return prompt;
}

export async function processAgentChat(
  courseId: string,
  _userId: string,
  payload: TAgentChatPayload
): Promise<AgentChatResult> {
  const db = getDb();
  const llm = getLlm();

  const model = payload.model && SUPPORTED_MODEL_IDS.has(payload.model)
    ? payload.model
    : DEFAULT_MODEL;

  const { data: course } = await db.from('course').select('id, title').eq('id', courseId).single();

  let lessonTitle = '';
  let lessonNote = '';

  if (payload.context?.lessonId) {
    const { data: lesson } = await db
      .from('lesson')
      .select('id, title, note')
      .eq('id', payload.context.lessonId)
      .eq('course_id', courseId)
      .single();

    if (lesson) {
      lessonTitle = lesson.title ?? '';
      lessonNote = lesson.note ?? '';

      const { data: langEntry } = await db
        .from('lesson_language')
        .select('content')
        .eq('lesson_id', payload.context.lessonId)
        .limit(1)
        .maybeSingle();

      if (langEntry?.content) lessonNote = langEntry.content;
    }
  }

  const systemPrompt = buildSystemPrompt(course?.title ?? '', lessonTitle, lessonNote);

  const availableTools = AGENT_TOOLS.filter((t) => {
    if (t.function.name === 'update_lesson_text' && !payload.context?.lessonId) return false;
    if (t.function.name === 'update_question' && !payload.context?.exerciseId) return false;
    return true;
  });

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...(payload.history ?? []).map((h) => ({ role: h.role as 'user' | 'assistant', content: h.content })),
    { role: 'user', content: payload.message }
  ];

  const response = await llm.chat.completions.create({
    model,
    messages,
    tools: availableTools,
    tool_choice: 'auto',
    max_tokens: 2000
  });

  const choice = response.choices[0];
  if (!choice) return { message: 'No response from model. Please try again.' };

  if (choice.message.tool_calls?.length) {
    const rawCall = choice.message.tool_calls[0];
    if (!('function' in rawCall)) return { message: 'Unsupported tool call. Please try again.' };

    const call = rawCall as OpenAI.Chat.Completions.ChatCompletionMessageFunctionToolCall;
    let args: Record<string, unknown>;

    try {
      args = JSON.parse(call.function.arguments);
    } catch {
      return { message: 'Failed to parse model response. Please try again.' };
    }

    switch (call.function.name) {
      case 'update_lesson_text':
        if (!payload.context?.lessonId) {
          return { message: 'No lesson is open. Navigate to a lesson first.', intent: 'update_lesson_text', actions: [] };
        }
        return execUpdateLessonText(args as { content: string }, courseId, payload.context.lessonId);

      case 'generate_questions':
        return execGenerateQuestions(args as { questions: Array<{ question: string; type: string; points?: number; options?: Array<{ label: string; is_correct: boolean }> }> });

      case 'update_question':
        return execUpdateQuestion(args as { questionId: string; title?: string; type?: string; points?: number; options?: Array<{ label: string; is_correct: boolean }> }, courseId);

      case 'draft_lesson':
        return execDraftLesson(args as { title: string; content: string }, courseId);

      default:
        return { message: `Unknown action: ${call.function.name}`, intent: call.function.name, actions: [] };
    }
  }

  return { message: choice.message.content ?? 'Unable to generate a response. Please try again.' };
}
