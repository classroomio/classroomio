import type OpenAI from 'openai';
import { getDb } from './db.js';
import type { AgentChatResult } from './types.js';

// ─── Tool definitions (sent to the LLM) ──────────────────────────────────────

export const AGENT_TOOLS: OpenAI.Chat.Completions.ChatCompletionFunctionTool[] = [
  {
    type: 'function',
    function: {
      name: 'update_lesson_text',
      description:
        "Rewrite or update the current lesson's HTML content. Only use when the user explicitly asks to update, rewrite, improve, or modify the lesson text/content.",
      parameters: {
        type: 'object',
        properties: {
          content: {
            type: 'string',
            description:
              'New HTML content for the lesson note. Use semantic HTML (h2, h3, p, ul, ol, li, strong, em). No <html>/<head>/<body> tags and no inline CSS.'
          }
        },
        required: ['content']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'generate_questions',
      description:
        'Generate quiz or exercise questions. Choose the most appropriate type:\n- RADIO: single correct answer (multiple choice)\n- CHECKBOX: multiple correct answers (select all that apply)\n- TEXTAREA: open-ended paragraph answer (analysis, explanation, opinion)',
      parameters: {
        type: 'object',
        properties: {
          questions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                question: { type: 'string' },
                type: {
                  type: 'string',
                  enum: ['RADIO', 'CHECKBOX', 'TEXTAREA'],
                  description:
                    'RADIO = single correct answer; CHECKBOX = multiple correct answers; TEXTAREA = open-ended'
                },
                points: { type: 'number', description: 'Point value (default: 1)' },
                options: {
                  type: 'array',
                  description: 'Required for RADIO and CHECKBOX. Omit for TEXTAREA.',
                  items: {
                    type: 'object',
                    properties: {
                      label: { type: 'string' },
                      is_correct: { type: 'boolean' }
                    },
                    required: ['label', 'is_correct']
                  }
                }
              },
              required: ['question', 'type']
            }
          }
        },
        required: ['questions']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_question',
      description:
        'Update an existing question in an exercise — change its text, type, points, or options.',
      parameters: {
        type: 'object',
        properties: {
          questionId: { type: 'string', description: 'UUID of the question to update' },
          title: { type: 'string', description: 'New question text (omit to keep existing)' },
          type: {
            type: 'string',
            enum: ['RADIO', 'CHECKBOX', 'TEXTAREA'],
            description: 'New question type (omit to keep existing)'
          },
          points: { type: 'number', description: 'New point value (omit to keep existing)' },
          options: {
            type: 'array',
            description: 'Replacement options for RADIO/CHECKBOX. Replaces ALL existing options.',
            items: {
              type: 'object',
              properties: {
                label: { type: 'string' },
                is_correct: { type: 'boolean' }
              },
              required: ['label', 'is_correct']
            }
          }
        },
        required: ['questionId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'draft_lesson',
      description:
        'Create a brand new draft lesson for the course. Use when the user asks to write, create, or draft a new lesson.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          content: {
            type: 'string',
            description: 'HTML content for the lesson note. Semantic HTML, no CSS.'
          }
        },
        required: ['title', 'content']
      }
    }
  }
];

// ─── Tool executors ───────────────────────────────────────────────────────────

export async function execUpdateLessonText(
  args: { content: string },
  courseId: string,
  lessonId: string
): Promise<AgentChatResult> {
  const db = getDb();

  const { data: lesson, error: lessonErr } = await db
    .from('lesson')
    .select('id, title')
    .eq('id', lessonId)
    .eq('course_id', courseId)
    .single();

  if (lessonErr || !lesson) {
    return { message: 'Could not find the specified lesson in this course.', intent: 'update_lesson_text', actions: [] };
  }

  const { data: existingLang } = await db
    .from('lesson_language')
    .select('id')
    .eq('lesson_id', lessonId)
    .eq('locale', 'en')
    .maybeSingle();

  let updateError;

  if (existingLang) {
    ({ error: updateError } = await db
      .from('lesson_language')
      .update({ content: args.content })
      .eq('id', existingLang.id));
  } else {
    const { data: anyLang } = await db
      .from('lesson_language')
      .select('id')
      .eq('lesson_id', lessonId)
      .limit(1)
      .maybeSingle();

    if (anyLang) {
      ({ error: updateError } = await db
        .from('lesson_language')
        .update({ content: args.content })
        .eq('id', anyLang.id));
    } else {
      ({ error: updateError } = await db
        .from('lesson')
        .update({ note: args.content })
        .eq('id', lessonId));
    }
  }

  if (updateError) {
    console.error('[agent] update_lesson_text:', updateError);
    return { message: `Failed to update lesson: ${updateError.message}`, intent: 'update_lesson_text', actions: [] };
  }

  return {
    message: `Lesson "${lesson.title}" updated. Refresh the page to see changes.`,
    intent: 'update_lesson_text',
    actions: [{ type: 'update_lesson_text', description: `Updated "${lesson.title}"`, result: { lessonId } }]
  };
}

export async function execGenerateQuestions(args: {
  questions: Array<{
    question: string;
    type: string;
    points?: number;
    options?: Array<{ label: string; is_correct: boolean }>;
  }>;
}): Promise<AgentChatResult> {
  const { questions } = args;
  const typeLabel = { RADIO: 'Single choice', CHECKBOX: 'Multiple choice', TEXTAREA: 'Open-ended' } as Record<string, string>;

  const summary = questions
    .map((q, i) => {
      let line = `${i + 1}. **${q.question}** — ${typeLabel[q.type] ?? q.type}${q.points ? ` (${q.points} pt${q.points !== 1 ? 's' : ''})` : ''}`;
      if (q.options?.length) {
        line += '\n   ' + q.options.map((o) => `${o.is_correct ? '✓' : '○'} ${o.label}`).join('  ');
      }
      return line;
    })
    .join('\n\n');

  return {
    message: `Generated ${questions.length} question${questions.length !== 1 ? 's' : ''}:\n\n${summary}`,
    intent: 'generate_questions',
    actions: [{ type: 'generate_questions', description: `Generated ${questions.length} question(s)`, result: questions }]
  };
}

export async function execUpdateQuestion(
  args: {
    questionId: string;
    title?: string;
    type?: string;
    points?: number;
    options?: Array<{ label: string; is_correct: boolean }>;
  },
  courseId: string
): Promise<AgentChatResult> {
  const db = getDb();

  const { data: question, error: qErr } = await db
    .from('question')
    .select('id, title, question_type_id, exercise:exercise_id(id, lesson:lesson_id(id, course_id))')
    .eq('id', args.questionId)
    .single();

  if (qErr || !question) {
    return { message: 'Could not find the specified question.', intent: 'update_question', actions: [] };
  }

  const exercise = question.exercise as unknown as { lesson: { course_id: string } | null } | null;
  if (exercise?.lesson?.course_id !== courseId) {
    return { message: 'This question does not belong to the current course.', intent: 'update_question', actions: [] };
  }

  const typeMap: Record<string, number> = { RADIO: 1, CHECKBOX: 2, TEXTAREA: 3 };
  const newTypeId = args.type ? typeMap[args.type] : undefined;

  if (args.type && !newTypeId) {
    return { message: `Unknown question type: ${args.type}`, intent: 'update_question', actions: [] };
  }

  const updates: Record<string, unknown> = {};
  if (args.title !== undefined) updates.title = args.title;
  if (newTypeId !== undefined) updates.question_type_id = newTypeId;
  if (args.points !== undefined) updates.points = args.points;

  if (Object.keys(updates).length > 0) {
    const { error } = await db.from('question').update(updates).eq('id', args.questionId);
    if (error) {
      console.error('[agent] update_question:', error);
      return { message: `Failed to update question: ${error.message}`, intent: 'update_question', actions: [] };
    }
  }

  const effectiveTypeId = newTypeId ?? (question.question_type_id as number);
  if (args.options && effectiveTypeId !== 3) {
    await db.from('option').delete().eq('question_id', args.questionId);
    const { error: optErr } = await db.from('option').insert(
      args.options.map((o) => ({ question_id: args.questionId, label: o.label, is_correct: o.is_correct }))
    );
    if (optErr) {
      return { message: `Question updated, but failed to replace options: ${optErr.message}`, intent: 'update_question', actions: [] };
    }
  }

  const updatedTitle = args.title ?? (question.title as string);
  return {
    message: `Question "${updatedTitle}" updated. Refresh the exercise to see changes.`,
    intent: 'update_question',
    actions: [{ type: 'update_question', description: `Updated "${updatedTitle}"`, result: { questionId: args.questionId } }]
  };
}

export async function execDraftLesson(
  args: { title: string; content: string },
  courseId: string
): Promise<AgentChatResult> {
  const db = getDb();

  const { data: existing } = await db
    .from('lesson')
    .select('order')
    .eq('course_id', courseId)
    .order('order', { ascending: false })
    .limit(1);

  const nextOrder = existing?.length ? (existing[0].order ?? 0) + 1 : 0;

  const { data: lesson, error } = await db
    .from('lesson')
    .insert({ title: args.title, note: args.content, course_id: courseId, is_unlocked: false, order: nextOrder })
    .select('id, title')
    .single();

  if (error || !lesson) {
    console.error('[agent] draft_lesson:', error);
    return { message: `Failed to create lesson: ${error?.message ?? 'unknown error'}`, intent: 'draft_lesson', actions: [] };
  }

  return {
    message: `Created draft lesson **"${lesson.title}"** (locked). Find it in the lessons list to review and publish.`,
    intent: 'draft_lesson',
    actions: [{ type: 'draft_lesson', description: `Created draft "${lesson.title}"`, result: { lessonId: lesson.id, title: lesson.title } }]
  };
}
