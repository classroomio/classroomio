export type AgentToolProgressStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

/** Render in UI via `ToolLine` / `$t` — no user-facing literals in `.ts`. */
export type ToolLineUi =
  | { shape: 'i18n'; key: string; vars?: Record<string, string | number> }
  | { shape: 'lesson_written'; lessonId: string; title: string; charCount: number }
  | {
      shape: 'exercise_questions';
      exerciseId: string;
      title: string;
      count: number;
      action: 'added' | 'updated';
    }
  /** Course landing page editor (same path as sidebar "Landing page"). Title may be empty. */
  | { shape: 'landing_page_updated'; title: string };

export interface ProgressStep {
  status: AgentToolProgressStatus;
  indent?: boolean;
  line: ToolLineUi;
}

const TOOLS_WITH_PENDING_COPY = new Set([
  'get_course_structure',
  'get_lesson_content',
  'get_exercise_details',
  'create_section',
  'update_section',
  'create_lesson',
  'update_lesson',
  'update_lesson_content',
  'create_exercise',
  'create_exercise_section',
  'update_exercise',
  'update_exercise_section',
  'add_questions',
  'update_questions',
  'reorder_content',
  'update_course_landing_page',
  'check_course_go_live_readiness',
  'go_live_course',
  'generate_course_plan',
  'ask_template_questions',
  'fetch_documentation_url'
]);

/** i18n key for the running / pending description of `toolName` */
export function getPendingToolI18nKey(toolName: string): string {
  if (TOOLS_WITH_PENDING_COPY.has(toolName)) {
    return `ai_assistant.tool.pending.${toolName}`;
  }

  return 'ai_assistant.tool.pending.unknown_tool';
}

export function getPendingToolI18nVars(toolName: string): Record<string, string | number | undefined> | undefined {
  if (TOOLS_WITH_PENDING_COPY.has(toolName)) {
    return undefined;
  }

  return { toolName };
}

function readString(record: Record<string, unknown>, key: string): string | undefined {
  const v = record[key];
  return typeof v === 'string' ? v : undefined;
}

function prettifyUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    const path = parsed.pathname === '/' ? '' : parsed.pathname.replace(/\/$/, '');

    return `${parsed.host}${path}${parsed.search}`;
  } catch {
    return rawUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }
}

function readPositiveInt(record: Record<string, unknown>, key: string): number {
  const v = record[key];
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;

  return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : 0;
}

export function getCompletedToolLine(toolName: string, result: unknown): ToolLineUi {
  const r = (result ?? {}) as Record<string, unknown>;

  switch (toolName) {
    case 'create_section':
      return {
        shape: 'i18n',
        key: 'ai_assistant.tool.done.create_section',
        vars: { title: readString(r, 'title') ?? '' }
      };
    case 'update_section':
      return {
        shape: 'i18n',
        key: 'ai_assistant.tool.done.update_section',
        vars: { title: readString(r, 'title') ?? '' }
      };
    case 'create_lesson':
      return {
        shape: 'i18n',
        key: 'ai_assistant.tool.done.create_lesson',
        vars: { title: readString(r, 'title') ?? '' }
      };
    case 'update_lesson':
      return {
        shape: 'i18n',
        key: 'ai_assistant.tool.done.update_lesson',
        vars: { title: readString(r, 'title') ?? '' }
      };
    case 'update_lesson_content': {
      const lessonId = readString(r, 'lessonId') ?? '';
      const rawTitle = readString(r, 'lessonTitle');
      const displayTitle = rawTitle && rawTitle.trim().length > 0 ? rawTitle : '';
      const contentLength = readPositiveInt(r, 'contentLength');

      if (lessonId && displayTitle) {
        return { shape: 'lesson_written', lessonId, title: displayTitle, charCount: contentLength };
      }

      return {
        shape: 'i18n',
        key: 'ai_assistant.tool.done.update_lesson_content_fallback',
        vars: { count: contentLength }
      };
    }
    case 'create_exercise': {
      const count = readPositiveInt(r, 'questionCount');
      const title = readString(r, 'title') ?? '';
      const exerciseId = readString(r, 'id') ?? '';

      if (exerciseId && title) {
        return { shape: 'exercise_questions', exerciseId, title, count, action: 'added' };
      }

      return { shape: 'i18n', key: 'ai_assistant.tool.done.create_exercise', vars: { title, count } };
    }
    case 'update_exercise':
      return {
        shape: 'i18n',
        key: 'ai_assistant.tool.done.update_exercise',
        vars: { title: readString(r, 'title') ?? '' }
      };
    case 'update_exercise_section':
      return {
        shape: 'i18n',
        key: 'ai_assistant.tool.done.update_exercise_section',
        vars: { title: readString(r, 'title') ?? '' }
      };
    case 'add_questions': {
      const exerciseId = readString(r, 'exerciseId') ?? '';
      const rawTitle = readString(r, 'exerciseTitle');
      const displayTitle = rawTitle && rawTitle.trim().length > 0 ? rawTitle : '';
      const addedCount = readPositiveInt(r, 'addedCount');

      if (exerciseId && displayTitle) {
        return { shape: 'exercise_questions', exerciseId, title: displayTitle, count: addedCount, action: 'added' };
      }

      return {
        shape: 'i18n',
        key: 'ai_assistant.tool.done.add_questions_fallback',
        vars: { count: addedCount }
      };
    }
    case 'update_questions': {
      const exerciseId = readString(r, 'exerciseId') ?? '';
      const rawTitle = readString(r, 'exerciseTitle');
      const displayTitle = rawTitle && rawTitle.trim().length > 0 ? rawTitle : '';
      const updatedCount = readPositiveInt(r, 'updatedCount');

      if (exerciseId && displayTitle) {
        return { shape: 'exercise_questions', exerciseId, title: displayTitle, count: updatedCount, action: 'updated' };
      }

      return {
        shape: 'i18n',
        key: 'ai_assistant.tool.done.update_questions_fallback',
        vars: { count: updatedCount }
      };
    }
    case 'create_exercise_section':
      return {
        shape: 'i18n',
        key: 'ai_assistant.tool.done.create_exercise_section',
        vars: { title: readString(r, 'title') ?? '' }
      };
    case 'get_course_structure':
      return { shape: 'i18n', key: 'ai_assistant.tool.done.get_course_structure' };
    case 'get_lesson_content':
      return { shape: 'i18n', key: 'ai_assistant.tool.done.get_lesson_content' };
    case 'get_exercise_details':
      return { shape: 'i18n', key: 'ai_assistant.tool.done.get_exercise_details' };
    case 'reorder_content':
      return { shape: 'i18n', key: 'ai_assistant.tool.done.reorder_content' };
    case 'update_course_landing_page':
      return { shape: 'landing_page_updated', title: readString(r, 'title')?.trim() ?? '' };
    case 'check_course_go_live_readiness': {
      const blockers = r.blockers;
      const blockerCount = Array.isArray(blockers) ? blockers.length : 0;
      const warnings = r.warnings;
      const warningCount = Array.isArray(warnings) ? warnings.length : 0;

      if (blockerCount === 0) {
        return {
          shape: 'i18n',
          key: 'ai_assistant.tool.done.check_go_live_ready',
          vars: { warningCount }
        };
      }

      return { shape: 'i18n', key: 'ai_assistant.tool.done.check_go_live_blocked', vars: { blockerCount } };
    }
    case 'go_live_course': {
      const isPublished = r.isPublished === true;
      return isPublished
        ? {
            shape: 'i18n',
            key: 'ai_assistant.tool.done.go_live_published',
            vars: { title: readString(r, 'title') ?? '' }
          }
        : { shape: 'i18n', key: 'ai_assistant.tool.done.go_live_not_published' };
    }
    case 'generate_course_plan':
      return { shape: 'i18n', key: 'ai_assistant.tool.done.generate_course_plan' };
    case 'ask_template_questions':
      return { shape: 'i18n', key: 'ai_assistant.tool.done.ask_template_questions' };
    case 'fetch_documentation_url': {
      const rawUrl = readString(r, 'url') ?? '';

      return {
        shape: 'i18n',
        key: 'ai_assistant.tool.done.fetch_documentation_url',
        vars: { url: rawUrl ? prettifyUrl(rawUrl) : '' }
      };
    }
    default:
      return { shape: 'i18n', key: 'ai_assistant.tool.done.generic' };
  }
}

export function getPendingToolLine(toolName: string, input?: unknown): ToolLineUi {
  if (toolName === 'fetch_documentation_url') {
    const rawUrl =
      typeof input === 'object' && input !== null ? readString(input as Record<string, unknown>, 'url') : undefined;

    if (rawUrl) {
      return {
        shape: 'i18n',
        key: 'ai_assistant.tool.pending.fetch_documentation_url_with_url',
        vars: { url: prettifyUrl(rawUrl) }
      };
    }
  }

  return {
    shape: 'i18n',
    key: getPendingToolI18nKey(toolName),
    vars: getPendingToolI18nVars(toolName) as Record<string, string | number> | undefined
  };
}

export const MUTATION_TOOLS = [
  'create_section',
  'update_section',
  'create_lesson',
  'update_lesson',
  'update_lesson_content',
  'create_exercise',
  'create_exercise_section',
  'update_exercise',
  'update_exercise_section',
  'add_questions',
  'update_questions',
  'reorder_content',
  'update_course_landing_page',
  'go_live_course'
];
