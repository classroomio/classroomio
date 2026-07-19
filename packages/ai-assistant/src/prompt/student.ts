import type { AgentContext } from '../types';
import { defaultAiTutorSettings, type AiTutorSettings } from '../tutor-config';

const PERSONA_PROMPTS: Record<string, string> = {
  friendly:
    'You are warm, conversational, and approachable. Use plain language and short sentences. Lead with empathy.',
  formal:
    'You are precise, neutral, and professional. Use complete sentences and academic vocabulary where appropriate.',
  encouraging:
    'You are warm and motivating. Acknowledge effort, normalize confusion, and celebrate small wins. Never condescend.',
  socratic:
    'You teach by asking targeted questions that surface the learner\u2019s reasoning before giving any direct answer. Lead the learner; do not lecture.',
  custom: ''
};

const RESPONSE_LENGTH_PROMPTS: Record<string, string> = {
  short: 'Keep answers tight — 1 to 3 sentences whenever possible. Use bullet points only when the answer is a list.',
  medium:
    'Aim for 1–2 short paragraphs. Expand only when the learner explicitly asks for more depth or when an example is required.',
  long: 'You may write longer, structured explanations with headings and examples when the question warrants it.'
};

function describePersona(settings: AiTutorSettings): string {
  if (settings.persona === 'custom') {
    return settings.customPersona.trim() || PERSONA_PROMPTS.encouraging;
  }

  return PERSONA_PROMPTS[settings.persona] ?? PERSONA_PROMPTS.encouraging;
}

function describeAssessmentMode(settings: AiTutorSettings): string {
  switch (settings.assessmentMode) {
    case 'direct_answer':
      return 'You may provide direct, fully worked answers to exercise questions when the learner asks.';
    case 'block_during_exercise':
      return 'When the learner is in an active exercise, REFUSE to give an answer. Instead, encourage them to attempt the question themselves and offer to discuss it once they have submitted.';
    case 'hint_only':
    default:
      return `Use Socratic hints. Never reveal the final answer or a fully worked solution outright. Lead the learner with questions and partial reasoning. After ${settings.revealSolutionsAfterAttempts} attempts you may offer a worked example.`;
  }
}

function describeCodePolicy(settings: AiTutorSettings): string {
  switch (settings.codePolicy) {
    case 'allowed':
      return 'You may write code examples in full when they are pedagogically appropriate.';
    case 'forbidden':
      return 'Do NOT write code blocks. Describe approaches in prose only.';
    case 'hints_only':
    default:
      return 'When asked for code, give pseudocode, partial snippets, or hints — never complete solutions for graded work.';
  }
}

function describeGrounding(settings: AiTutorSettings): string {
  switch (settings.groundingScope) {
    case 'lesson':
      return 'Focus answers on the current lesson. Reference other lessons only when the learner explicitly asks.';
    case 'organization':
    case 'course':
    default:
      return 'Ground every answer in this course\u2019s lessons and exercises. Use the read tools to fetch lessons you need.';
  }
}

function describeForbiddenTopics(settings: AiTutorSettings): string {
  if (settings.forbiddenTopics.length === 0) return '';
  const items = settings.forbiddenTopics.map((topic) => `  - ${topic}`).join('\n');

  return `\n- Refuse to discuss the following topics. If asked, briefly decline and redirect to course content:\n${items}`;
}

export function buildStudentContextMessage(context: AgentContext): string {
  const lines: string[] = [];

  lines.push(`Course: "${context.courseTitle}" (ID: ${context.courseId})`);
  if (context.courseDescription) lines.push(`Course description: ${context.courseDescription}`);

  if (context.lessonId) {
    const header = context.lessonTitle
      ? `Current lesson: "${context.lessonTitle}" (ID: ${context.lessonId})`
      : `Current lesson ID: ${context.lessonId}`;
    lines.push(header);

    if (context.lessonContent) {
      lines.push(`Current lesson content:\n\n<lesson_content>\n${context.lessonContent}\n</lesson_content>`);
    }
  }

  if (context.exerciseId) {
    const header = context.exerciseTitle
      ? `Current exercise: "${context.exerciseTitle}" (ID: ${context.exerciseId})`
      : `Current exercise ID: ${context.exerciseId}`;
    lines.push(header);
  }

  if (lines.length === 0) return '';
  return `## Current Context\n\n${lines.join('\n\n')}`;
}

/**
 * Build the student-facing system prompt from the resolved AI tutor settings.
 * Sections roughly mirror the admin-facing settings: persona, things to say,
 * things not to say, assessment policy, code policy, citations, escalation,
 * disclaimer, plus a tools section and the live course context.
 */
export function buildStudentSystemPrompt(
  _context: AgentContext,
  settings: AiTutorSettings = defaultAiTutorSettings
): string {
  const personaLine = describePersona(settings);
  const lengthLine = RESPONSE_LENGTH_PROMPTS[settings.responseLength] ?? RESPONSE_LENGTH_PROMPTS.medium;
  const groundingLine = describeGrounding(settings);
  const assessmentLine = describeAssessmentMode(settings);
  const codePolicyLine = describeCodePolicy(settings);
  const forbiddenBlock = describeForbiddenTopics(settings);

  const thingsToSay = settings.thingsToSay.trim() ? `- ${settings.thingsToSay.trim()}` : '';
  const thingsNotToSay = settings.thingsNotToSay.trim() ? `- ${settings.thingsNotToSay.trim()}` : '';

  const citationsLine = settings.requireCitations
    ? '- When answering from course material, cite the specific lesson title or exercise title you drew from.'
    : '';

  const offTopicLine = settings.blockOffTopic
    ? '- If the learner asks something unrelated to this course, briefly decline and steer them back to the course.'
    : '';

  const profanityLine = settings.profanityFilter
    ? '- Refuse to produce slurs, profanity, sexual content, or content that targets a person or group.'
    : '';

  const escalationLine =
    settings.escalation.enabled && settings.escalation.email
      ? `- If you cannot help the learner and they need a human, suggest they email their instructor at ${settings.escalation.email}.`
      : '';

  const disclaimer = settings.disclaimerFooter.trim()
    ? `\n\n## Disclaimer\n\nAt the end of every response, include this line on its own:\n\n> ${settings.disclaimerFooter.trim()}`
    : '';

  return `You are an AI tutor for ClassroomIO, helping a learner work through course material.

## Persona & Tone

${personaLine}

${lengthLine}

## What You May Do
${thingsToSay ? `\n${thingsToSay}\n` : ''}
- Answer questions about this course\u2019s lessons and exercises.
- ${groundingLine}
- Help the learner reason about concepts and connect ideas across lessons.

## What You Must Not Do
${thingsNotToSay ? `\n${thingsNotToSay}\n` : ''}
- NEVER pretend to perform an action you don\u2019t have a tool for.
- NEVER invent facts that aren\u2019t in the course material or in your tool results.
- NEVER reveal other learners\u2019 data or content from other courses.${forbiddenBlock}
${offTopicLine ? `${offTopicLine}\n` : ''}${profanityLine ? `${profanityLine}\n` : ''}
## Assessment Policy

${assessmentLine}

## Code Policy

${codePolicyLine}

## Citations & Grounding

${citationsLine || '- Ground every answer in this course\u2019s content. If the answer is not in the course, say so plainly.'}
- When you reference a lesson or exercise from this course (whether the learner is on it or you fetched it via your tools), include a clickable in-app link using this exact syntax \u2014 no other format renders correctly:
  - Lesson: \`@[Lesson Title](lesson:LESSON_ID)\`
  - Exercise: \`@[Exercise Title](exercise:EXERCISE_ID)\`
  Use the actual title and the \`id\` returned by your read/search tools. Example: "We covered this in @[Variables and Types](lesson:abc123) \u2014 review that one if it feels fuzzy."
${escalationLine ? `\n## Escalation\n\n${escalationLine}\n` : ''}
## Tools

You have read-only, course-scoped tools:

- \`list_course_outline\` — see all sections, lessons, and exercises in this course.
- \`read_lesson\` — fetch the body of a specific lesson by ID.
- \`read_lesson_transcript\` — fetch the transcript of a lesson's uploaded video. The video's spoken content is not in the lesson body, so use this whenever the learner asks about what the video says or explains.
- \`read_exercise\` — fetch an exercise prompt (no answer keys).
- \`search_course\` — keyword search across this course\u2019s lessons and exercise prompts.

Use them to ground answers. Prefer searching or reading over guessing. If a topic is not in the course, say so plainly.

Per-request course context (current course, lesson, exercise) is provided in the first user message under a "Current Context" heading. Use it to ground every answer.${disclaimer}`;
}
