const TOOL_LABELS: Record<string, string> = {
  get_course_structure: 'Reading course structure',
  get_lesson_content: 'Reading lesson content',
  get_exercise_details: 'Reading exercise',
  create_section: 'Creating section',
  update_section: 'Updating section',
  create_lesson: 'Creating lesson',
  update_lesson: 'Updating lesson',
  update_lesson_content: 'Writing lesson content',
  create_exercise: 'Creating exercise',
  update_exercise: 'Updating exercise',
  add_questions: 'Adding questions',
  update_questions: 'Updating questions',
  reorder_content: 'Reordering content',
  update_course_landing_page: 'Updating landing page',
  check_course_go_live_readiness: 'Checking go-live readiness',
  go_live_course: 'Publishing course',
  generate_course_plan: 'Generating course plan'
};

export function getToolLabel(toolName: string): string {
  return TOOL_LABELS[toolName] || toolName;
}

export function getToolResultLabel(toolName: string, result: unknown): string {
  const r = result as Record<string, unknown>;

  switch (toolName) {
    case 'create_section':
      return `Created section: ${r.title}`;
    case 'update_section':
      return `Updated section: ${r.title}`;
    case 'create_lesson':
      return `Created lesson: ${r.title}`;
    case 'update_lesson':
      return `Updated lesson: ${r.title}`;
    case 'update_lesson_content':
      return `Wrote ${r.contentLength} chars`;
    case 'create_exercise':
      return `Created exercise with ${r.questionCount} questions`;
    case 'update_exercise':
      return `Updated exercise: ${r.title}`;
    case 'add_questions':
      return `Added ${r.addedCount} questions`;
    case 'update_questions':
      return `Updated ${r.updatedCount} questions`;
    case 'get_course_structure':
      return 'Course structure loaded';
    case 'get_lesson_content':
      return 'Lesson content loaded';
    case 'get_exercise_details':
      return 'Exercise loaded';
    case 'reorder_content':
      return 'Content reordered';
    case 'update_course_landing_page':
      return `Updated landing page: ${r.title}`;
    case 'check_course_go_live_readiness': {
      const blockerCount = Array.isArray(r.blockers) ? r.blockers.length : 0;
      const warningCount = Array.isArray(r.warnings) ? r.warnings.length : 0;

      return blockerCount === 0
        ? `Ready to go live${warningCount > 0 ? ` with ${warningCount} warnings` : ''}`
        : `${blockerCount} blockers before go-live`;
    }
    case 'go_live_course':
      return r.isPublished ? `Published course: ${r.title}` : 'Course was not published';
    case 'generate_course_plan':
      return 'Course plan generated';
    default:
      return 'Done';
  }
}

export const MUTATION_TOOLS = [
  'create_section',
  'update_section',
  'create_lesson',
  'update_lesson',
  'update_lesson_content',
  'create_exercise',
  'update_exercise',
  'add_questions',
  'update_questions',
  'reorder_content',
  'update_course_landing_page',
  'go_live_course'
];

export interface ProgressStep {
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  indent?: boolean;
}
