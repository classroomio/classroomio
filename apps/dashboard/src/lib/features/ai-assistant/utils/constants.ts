/** When set (e.g. to `1`), the streaming "don't reload" banner stays hidden across sessions */
export const AI_AGENT_RUNNING_WARNING_DISMISSED_KEY = 'classroomio-ai-agent-running-warning-dismissed';

export const AI_COURSE_CHAT_DEFAULT_WIDTH = 360;
export const AI_COURSE_CHAT_MIN_WIDTH = 280;
export const AI_COURSE_CHAT_MAX_WIDTH = 520;
export const AI_COURSE_CHAT_STORAGE_KEY = 'classroomio-ai-course-chat-width';
export const AI_CHAT_MODEL_STORAGE_KEY = 'classroomio-ai-chat-model';

/** Display via `$t(entry.key)`; `prompt` is sent to the model (English). */
export const AI_ASSISTANT_QUICK_ACTION_ENTRIES = [
  {
    key: 'ai_assistant.quick_action.upload_document_course',
    prompt: 'Upload a document to create a course'
  },
  {
    key: 'ai_assistant.quick_action.draft_lesson',
    prompt: 'Draft a lesson'
  },
  {
    key: 'ai_assistant.quick_action.generate_questions_from_lesson',
    prompt: 'Generate questions from this lesson'
  },
  {
    key: 'ai_assistant.quick_action.summarize_lesson',
    prompt: 'Summarize this lesson'
  },
  {
    key: 'ai_assistant.quick_action.publish_course',
    prompt: 'Help me publish this course'
  }
] as const;

/** Student-facing quick-action chips. Display via `$t(entry.key)`; `prompt` is sent to the model (English). */
export const STUDENT_QUICK_ACTION_ENTRIES = [
  {
    key: 'ai_assistant.student_quick_action.explain_lesson',
    prompt: 'Explain this lesson'
  },
  {
    key: 'ai_assistant.student_quick_action.quiz_me',
    prompt: 'Quiz me on this'
  },
  {
    key: 'ai_assistant.student_quick_action.summarize_section',
    prompt: 'Summarize this section'
  },
  {
    key: 'ai_assistant.student_quick_action.what_to_review',
    prompt: 'What should I review next?'
  }
] as const;
