import OpenAI from 'openai';
import { env } from '$src/config/env';
import { getSupabase } from '$src/utils/supabase';
import type { TAgentChatPayload, AgentAction, AgentChatResult } from '$src/types/agent';

let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }
  return openaiClient;
}

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
        'Generate quiz or exercise questions from the lesson content or a given topic. Use when the user asks to create, generate, or come up with questions.',
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
                    'RADIO for single-choice, CHECKBOX for multiple-choice, TEXTAREA for open-ended'
                },
                options: {
                  type: 'array',
                  description: 'Answer options (required for RADIO and CHECKBOX types)',
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

You can help with:
- Answering questions about course design and pedagogy
- Updating the current lesson's content (update_lesson_text tool)
- Generating quiz questions from lesson content (generate_questions tool)
- Drafting new lessons for the course (draft_lesson tool)

Guidelines:
- Be concise and helpful
- When generating HTML content, use clean semantic markup without CSS styles
- For questions, choose the appropriate type: RADIO (single answer), CHECKBOX (multiple answers), TEXTAREA (open-ended)
- Always confirm successful actions clearly`;

  return prompt;
}

async function executeUpdateLessonText(
  args: { content: string },
  courseId: string,
  lessonId: string
): Promise<AgentChatResult> {
  const supabase = getSupabase();

  // Verify lesson belongs to course for safety
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

  // Try to update via lesson_language table first (supports localization)
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
    // Check if any lesson_language entry exists for a different locale
    const { data: anyLang } = await supabase
      .from('lesson_language')
      .select('id, locale')
      .eq('lesson_id', lessonId)
      .limit(1)
      .maybeSingle();

    if (anyLang) {
      // Update the existing locale entry
      const { error } = await supabase
        .from('lesson_language')
        .update({ content: args.content })
        .eq('id', anyLang.id);
      updateError = error;
    } else {
      // Fall back to updating lesson.note directly
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

  const actions: AgentAction[] = [
    {
      type: 'update_lesson_text',
      description: `Updated content for lesson "${lesson.title}"`,
      result: { lessonId, title: lesson.title }
    }
  ];

  return {
    message: `The lesson "${lesson.title}" has been updated successfully. Refresh the page to see your changes.`,
    intent: 'update_lesson_text',
    actions
  };
}

async function executeGenerateQuestions(args: {
  questions: Array<{
    question: string;
    type: string;
    options?: Array<{ label: string; is_correct: boolean }>;
  }>;
}): Promise<AgentChatResult> {
  const { questions } = args;

  const summary = questions
    .map(
      (q, i) =>
        `${i + 1}. **${q.question}** (${q.type})${
          q.options
            ? '\n   Options: ' + q.options.map((o) => `${o.label}${o.is_correct ? ' ✓' : ''}`).join(', ')
            : ''
        }`
    )
    .join('\n');

  const actions: AgentAction[] = [
    {
      type: 'generate_questions',
      description: `Generated ${questions.length} question(s)`,
      result: questions
    }
  ];

  return {
    message: `I've generated ${questions.length} question(s) for you:\n\n${summary}\n\nYou can copy these into your exercise editor.`,
    intent: 'generate_questions',
    actions
  };
}

async function executeDraftLesson(
  args: { title: string; content: string },
  courseId: string
): Promise<AgentChatResult> {
  const supabase = getSupabase();

  // Get the current max order for lessons in this course
  const { data: existingLessons } = await supabase
    .from('lesson')
    .select('order')
    .eq('course_id', courseId)
    .order('order', { ascending: false })
    .limit(1);

  const nextOrder = existingLessons && existingLessons.length > 0 ? (existingLessons[0].order ?? 0) + 1 : 0;

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
      message: `Failed to create the draft lesson: ${error?.message ?? 'Unknown error'}`,
      intent: 'draft_lesson',
      actions: []
    };
  }

  const actions: AgentAction[] = [
    {
      type: 'draft_lesson',
      description: `Created draft lesson "${newLesson.title}"`,
      result: { lessonId: newLesson.id, title: newLesson.title }
    }
  ];

  return {
    message: `I've created a new draft lesson titled **"${newLesson.title}"**. It is currently locked — you can review and unlock it from the lessons list.`,
    intent: 'draft_lesson',
    actions
  };
}

export async function processAgentChat(
  courseId: string,
  userId: string,
  payload: TAgentChatPayload
): Promise<AgentChatResult> {
  const openai = getOpenAI();
  const supabase = getSupabase();

  // Fetch course info for context
  const { data: course } = await supabase
    .from('course')
    .select('id, title')
    .eq('id', courseId)
    .single();

  // Fetch lesson content if a lessonId is provided
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

      // Prefer lesson_language content (more up-to-date with localization)
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

  const availableTools =
    payload.context?.lessonId ? AGENT_TOOLS : AGENT_TOOLS.filter((t) => t.function.name !== 'update_lesson_text');

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...(payload.history ?? []).map((h) => ({
      role: h.role as 'user' | 'assistant',
      content: h.content
    })),
    { role: 'user', content: payload.message }
  ];

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    tools: availableTools,
    tool_choice: 'auto',
    max_tokens: 2000
  });

  const choice = response.choices[0];

  if (!choice) {
    return { message: 'No response from AI. Please try again.' };
  }

  // Handle tool calls (intent execution)
  if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
    const rawCall = choice.message.tool_calls[0];

    // Narrow to function tool call (the only type we use)
    if (!('function' in rawCall)) {
      return { message: 'Unsupported tool call type. Please try again.' };
    }

    const toolCall = rawCall as OpenAI.Chat.Completions.ChatCompletionMessageFunctionToolCall;
    let args: Record<string, unknown>;

    try {
      args = JSON.parse(toolCall.function.arguments);
    } catch {
      return { message: 'Failed to parse AI response. Please try again.' };
    }

    switch (toolCall.function.name) {
      case 'update_lesson_text':
        if (!payload.context?.lessonId) {
          return {
            message: 'No lesson is currently selected. Please navigate to a lesson first.',
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
              options?: Array<{ label: string; is_correct: boolean }>;
            }>;
          }
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

  // Plain conversational response
  return {
    message: choice.message.content ?? 'I was unable to generate a response. Please try again.'
  };
}
