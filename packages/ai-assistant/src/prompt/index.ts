import { AgentRole, type AgentContext } from '../types';
import { buildTeacherSystemPrompt } from './teacher';
import { buildStudentSystemPrompt } from './student';

/**
 * Builds a role-aware system prompt for the AI assistant.
 * Teacher prompts include Plan/Agent mode instructions and content writing guidelines.
 * Student prompts (v2) are read-only focused.
 */
export function buildSystemPrompt(context: AgentContext): string {
  switch (context.role) {
    case AgentRole.TEACHER:
      return buildTeacherSystemPrompt(context);
    case AgentRole.STUDENT:
      return buildStudentSystemPrompt(context);
    default:
      return buildTeacherSystemPrompt(context);
  }
}

export { buildTeacherSystemPrompt, buildStudentSystemPrompt };
