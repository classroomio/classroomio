import OpenAI from 'openai';
import { env } from '$src/config/env';
import { getSupabase } from '$src/utils/supabase';
import type { TAgentChatPayload, AgentAction, AgentChatResult } from '$src/types/agent';
import { DEFAULT_MODEL, SUPPORTED_MODEL_IDS } from '$src/constants/models';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

let openrouterClient: OpenAI | null = null;

function getClient(): OpenAI {
  if (!openrouterClient) {
    openrouterClient = new OpenAI({
      apiKey: env.OPENROUTER_API_KEY,
      baseURL: OPENROUTER_BASE_URL,
      defaultHeaders: {
        'HTTP-Referer': 'https://classroomio.com',
        'X-Title': 'ClassroomIO AI Course Assistant'
      }
    });
  }
  return openrouterClient;
}

// Question type names match the database typename column
const QUESTION_TYPE_LABELS: Record<string, string> = {
  RADIO: 'Single answer (one correct option, radio button)',
  CHECKBOX: 'Multiple answers (multiple correct options, checkboxes)',
  TEXTAREA: 'Paragraph (open-ended free-text, no auto-grading)'
};

const AGENT_TOOLS: OpenAI.Chat.Completions.ChatCompletionFunctionTool[] = [
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
              'New HTML content for the lesson note. Use semantic HTML tags (h2, h3, p, ul, ol, li, strong, em). Do not include <html>, <head>, <body> tags or any CSS styling.'
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
        'Generate quiz or exercise questions. Use when the user asks to create, generate, or come up with questions. Choose the most appropriate type for each question:\n- RADIO: single correct answer (multiple choice)\n- CHECKBOX: multiple correct answers (select all that apply)\n- TEXTAREA: open-ended paragraph answer (for analysis, explanation, opinion)',
      parameters: {
        type: 'object',
        properties: {
          questions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                question: { type: 'string', description: 'The question text' },
                type: {
                  type: 'string',
                  enum: ['RADIO', 'CHECKBOX', 'TEXTAREA'],
                  description:
                    'RADIO = single correct answer; CHECKBOX = multiple correct answers; TEXTAREA = open-ended paragraph'
                },
                points: {
                  type: 'number',
                  description: 'Point value for this question (default: 1)'
                },
                options: {
                  type: 'array',
                  description:
                    'Answer options. Required for RADIO and CHECKBOX types. Omit for TEXTAREA.',
                  items: {
                    type: 'object',
                    properties: {
                      label: { type: 'string', description: 'The option text' },
                      is_correct: {
                        type: 'boolean',
                        description:
                          'True if this is a correct answer. For RADIO, exactly one option should be correct.'
                      }
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
        'Update an existing question in an exercise. Use when the user asks to change, fix, reword, or modify a specific question. You can update the text, type, points, and/or options.',
      parameters: {
        type: 'object',
        properties: {
          questionId: {
            type: 'string',
            description: 'The UUID of the question to update'
          },
          title: {
            type: 'string',
            description: 'New question text (omit to keep existing)'
          },
          type: {
            type: 'string',
            enum: ['RADIO', 'CHECKBOX', 'TEXTAREA'],
            description: 'New question type (omit to keep existing)'
          },
          points: {
            type: 'number',
            description: 'New point value (omit to keep existing)'
          },
          options: {
            type: 'array',
            description:
              'Replacement options for RADIO or CHECKBOX questions. Providing this replaces ALL existing options.',
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
          title: { type: 'string', description: 'Title for the new lesson' },
          content: {
            type: 'string',
            description:
              'HTML content for the lesson note. Use semantic HTML tags. Do not include CSS or wrapper HTML tags.'
          }
        },
        required: ['title', 'content']
      }
    }
  }
];

function buildSystemPrompt(courseTitle: string, lessonTitle: string, lessonNote: string): string {
  let prompt = `You are an AI assistant for educators using ClassroomIO, a learning management system. You help teachers create and improve their course content.

Current course: "${courseTitle}"`;

  if (lessonTitle) {
    prompt += `\nCurrent lesson: "${lessonTitle}"`;
  }

  if (lessonNote) {
    const textContent = lessonNote
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 3000);
    prompt += `\n\nLesson content:\n${textContent}`;
  }

  prompt += `

Question types available:
${Object.entries(QUESTION_TYPE_LABELS)
  .map(([k, v]) => `- ${k}: ${v}`)
  .join('\n')}

You can help with:
- Answering questions about course design and pedagogy
- Updating the current lesson's content (update_lesson_text)
- Generating quiz questions with appropriate types (generate_questions)
- Updating existing questions (update_question)
- Drafting new lessons (draft_lesson)

When generating HTML content use clean semantic markup without CSS styles.`;

  return prompt;
}

// ─── Tool executors ────────────────────────────────────────────────────────────

async function executeUpdateLessonText(
  args: { content: string },
  courseId: string,
  lessonId: string
): Promise<AgentChatResult> {
  const supabase = getSupabase();

  const { data: lesson, error: lessonError } = await supabase
    .from('lesson')
    .select('id, title')
    .eq('id', lessonId)
    .eq('course_id', courseId)
    .single();

  if (lessonError || !lesson) {
    return {
      message: 'Could not find the specified lesson in this course.',
      intent: 'update_lesson_text',
      actions: []
    };
  }

  const { data: existingLang } = await supabase
    .from('lesson_language')
    .select('id')
    .eq('lesson_id', lessonId)
    .eq('locale', 'en')
    .maybeSingle();

  let updateError;

  if (existingLang) {
    const { error } = await supabase
      .from('lesson_language')
      .update({ content: args.content })
      .eq('id', existingLang.id);
    updateError = error;
  } else {
    const { data: anyLang } = await supabase
      .from('lesson_language')
      .select('id')
      .eq('lesson_id', lessonId)
      .limit(1)
      .maybeSingle();

    if (anyLang) {
      const { error } = await supabase
        .from('lesson_language')
        .update({ content: args.content })
        .eq('id', anyLang.id);
      updateError = error;
    } else {
      const { error } = await supabase
        .from('lesson')
        .update({ note: args.content })
        .eq('id', lessonId);
      updateError = error;
    }
  }

  if (updateError) {
    console.error('update_lesson_text error:', updateError);
    return {
      message: `Failed to update lesson content: ${updateError.message}`,
      intent: 'update_lesson_text',
      actions: []
    };
  }

  return {
    message: `The lesson "${lesson.title}" has been updated. Refresh the page to see changes.`,
    intent: 'update_lesson_text',
    actions: [
      {
        type: 'update_lesson_text',
        description: `Updated content for "${lesson.title}"`,
        result: { lessonId, title: lesson.title }
      }
    ]
  };
}

async function executeGenerateQuestions(args: {
  questions: Array<{
    question: string;
    type: string;
    points?: number;
    options?: Array<{ label: string; is_correct: boolean }>;
  }>;
}): Promise<AgentChatResult> {
  const { questions } = args;

  const summary = questions
    .map((q, i) => {
      const typeLabel = { RADIO: 'Single choice', CHECKBOX: 'Multiple choice', TEXTAREA: 'Open-ended' }[q.type] ?? q.type;
      let line = `${i + 1}. **${q.question}** — ${typeLabel}${q.points ? ` (${q.points} pt${q.points !== 1 ? 's' : ''})` : ''}`;
      if (q.options?.length) {
        line +=
          '\n   ' +
          q.options.map((o) => `${o.is_correct ? '✓' : '○'} ${o.label}`).join('  ');
      }
      return line;
    })
    .join('\n\n');

  return {
    message: `Generated ${questions.length} question${questions.length !== 1 ? 's' : ''}:\n\n${summary}`,
    intent: 'generate_questions',
    actions: [
      {
        type: 'generate_questions',
        description: `Generated ${questions.length} question(s)`,
        result: questions
      }
    ]
  };
}

async function executeUpdateQuestion(
  args: {
    questionId: string;
    title?: string;
    type?: string;
    points?: number;
    options?: Array<{ label: string; is_correct: boolean }>;
  },
  courseId: string
): Promise<AgentChatResult> {
  const supabase = getSupabase();

  // Verify question belongs to a lesson in this course
  const { data: question, error: qError } = await supabase
    .from('question')
    .select('id, title, question_type_id, points, exercise:exercise_id(id, lesson:lesson_id(id, course_id))')
    .eq('id', args.questionId)
    .single();

  if (qError || !question) {
    return {
      message: 'Could not find the specified question.',
      intent: 'update_question',
      actions: []
    };
  }

  // Type-safe course_id access
  const exercise = question.exercise as unknown as { id: string; lesson: { id: string; course_id: string } | null } | null;
  if (exercise?.lesson?.course_id !== courseId) {
    return {
      message: 'This question does not belong to the current course.',
      intent: 'update_question',
      actions: []
    };
  }

  // Resolve new question_type_id if type changed
  let newTypeId: number | undefined;
  if (args.type) {
    const typeMap: Record<string, number> = { RADIO: 1, CHECKBOX: 2, TEXTAREA: 3 };
    newTypeId = typeMap[args.type];
    if (!newTypeId) {
      return { message: `Unknown question type: ${args.type}`, intent: 'update_question', actions: [] };
    }
  }

  // Build the update object
  const updates: Record<string, unknown> = {};
  if (args.title !== undefined) updates.title = args.title;
  if (newTypeId !== undefined) updates.question_type_id = newTypeId;
  if (args.points !== undefined) updates.points = args.points;

  if (Object.keys(updates).length > 0) {
    const { error: updateError } = await supabase
      .from('question')
      .update(updates)
      .eq('id', args.questionId);

    if (updateError) {
      console.error('update_question error:', updateError);
      return {
        message: `Failed to update question: ${updateError.message}`,
        intent: 'update_question',
        actions: []
      };
    }
  }

  // Replace options if provided (only for RADIO/CHECKBOX)
  const effectiveTypeId = newTypeId ?? question.question_type_id;
  if (args.options && effectiveTypeId !== 3 /* TEXTAREA */) {
    // Delete all existing options
    await supabase.from('option').delete().eq('question_id', args.questionId);

    // Insert the new options
    const newOptions = args.options.map((o) => ({
      question_id: args.questionId,
      label: o.label,
      is_correct: o.is_correct
    }));
    const { error: optError } = await supabase.from('option').insert(newOptions);

    if (optError) {
      console.error('update_question options error:', optError);
      return {
        message: `Question text updated, but failed to update options: ${optError.message}`,
        intent: 'update_question',
        actions: []
      };
    }
  }

  const updatedTitle = args.title ?? (question.title as string);

  return {
    message: `Question updated: "${updatedTitle}". Refresh the exercise to see changes.`,
    intent: 'update_question',
    actions: [
      {
        type: 'update_question',
        description: `Updated question "${updatedTitle}"`,
        result: { questionId: args.questionId }
      }
    ]
  };
}

async function executeDraftLesson(
  args: { title: string; content: string },
  courseId: string
): Promise<AgentChatResult> {
  const supabase = getSupabase();

  const { data: existingLessons } = await supabase
    .from('lesson')
    .select('order')
    .eq('course_id', courseId)
    .order('order', { ascending: false })
    .limit(1);

  const nextOrder =
    existingLessons && existingLessons.length > 0 ? (existingLessons[0].order ?? 0) + 1 : 0;

  const { data: newLesson, error } = await supabase
    .from('lesson')
    .insert({
      title: args.title,
      note: args.content,
      course_id: courseId,
      is_unlocked: false,
      order: nextOrder
    })
    .select('id, title')
    .single();

  if (error || !newLesson) {
    console.error('draft_lesson error:', error);
    return {
      message: `Failed to create lesson: ${error?.message ?? 'Unknown error'}`,
      intent: 'draft_lesson',
      actions: []
    };
  }

  return {
    message: `Created draft lesson **"${newLesson.title}"** (locked). Find it in the lessons list to review and publish.`,
    intent: 'draft_lesson',
    actions: [
      {
        type: 'draft_lesson',
        description: `Created draft lesson "${newLesson.title}"`,
        result: { lessonId: newLesson.id, title: newLesson.title }
      }
    ]
  };
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export async function processAgentChat(
  courseId: string,
  userId: string,
  payload: TAgentChatPayload
): Promise<AgentChatResult> {
  const client = getClient();
  const supabase = getSupabase();

  const model = (() => {
    if (payload.model && SUPPORTED_MODEL_IDS.has(payload.model)) return payload.model;
    return DEFAULT_MODEL;
  })();

  const { data: course } = await supabase
    .from('course')
    .select('id, title')
    .eq('id', courseId)
    .single();

  let lessonTitle = '';
  let lessonNote = '';

  if (payload.context?.lessonId) {
    const { data: lesson } = await supabase
      .from('lesson')
      .select('id, title, note')
      .eq('id', payload.context.lessonId)
      .eq('course_id', courseId)
      .single();

    if (lesson) {
      lessonTitle = lesson.title ?? '';
      lessonNote = lesson.note ?? '';

      const { data: langEntry } = await supabase
        .from('lesson_language')
        .select('content')
        .eq('lesson_id', payload.context.lessonId)
        .limit(1)
        .maybeSingle();

      if (langEntry?.content) {
        lessonNote = langEntry.content;
      }
    }
  }

  const systemPrompt = buildSystemPrompt(course?.title ?? '', lessonTitle, lessonNote);

  // Only offer update_lesson_text when a lesson is in context
  // Only offer update_question when an exercise is in context
  const availableTools = AGENT_TOOLS.filter((t) => {
    if (t.function.name === 'update_lesson_text' && !payload.context?.lessonId) return false;
    if (t.function.name === 'update_question' && !payload.context?.exerciseId) return false;
    return true;
  });

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...(payload.history ?? []).map((h) => ({
      role: h.role as 'user' | 'assistant',
      content: h.content
    })),
    { role: 'user', content: payload.message }
  ];

  const response = await client.chat.completions.create({
    model,
    messages,
    tools: availableTools,
    tool_choice: 'auto',
    max_tokens: 2000
  });

  const choice = response.choices[0];

  if (!choice) {
    return { message: 'No response from the model. Please try again.' };
  }

  if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
    const rawCall = choice.message.tool_calls[0];

    if (!('function' in rawCall)) {
      return { message: 'Unsupported tool call type. Please try again.' };
    }

    const toolCall = rawCall as OpenAI.Chat.Completions.ChatCompletionMessageFunctionToolCall;
    let args: Record<string, unknown>;

    try {
      args = JSON.parse(toolCall.function.arguments);
    } catch {
      return { message: 'Failed to parse model response. Please try again.' };
    }

    switch (toolCall.function.name) {
      case 'update_lesson_text':
        if (!payload.context?.lessonId) {
          return {
            message: 'No lesson is currently open. Navigate to a lesson first.',
            intent: 'update_lesson_text',
            actions: []
          };
        }
        return executeUpdateLessonText(
          args as { content: string },
          courseId,
          payload.context.lessonId
        );

      case 'generate_questions':
        return executeGenerateQuestions(
          args as {
            questions: Array<{
              question: string;
              type: string;
              points?: number;
              options?: Array<{ label: string; is_correct: boolean }>;
            }>;
          }
        );

      case 'update_question':
        return executeUpdateQuestion(
          args as {
            questionId: string;
            title?: string;
            type?: string;
            points?: number;
            options?: Array<{ label: string; is_correct: boolean }>;
          },
          courseId
        );

      case 'draft_lesson':
        return executeDraftLesson(args as { title: string; content: string }, courseId);

      default:
        return {
          message: `Unknown action: ${toolCall.function.name}`,
          intent: toolCall.function.name,
          actions: []
        };
    }
  }

  return {
    message: choice.message.content ?? 'Unable to generate a response. Please try again.'
  };
}
