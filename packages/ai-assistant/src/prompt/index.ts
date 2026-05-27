import { AgentRole, type AgentContext } from '../types';
import { buildTeacherSystemPrompt, buildTeacherContextMessage } from './teacher';
import { buildStudentSystemPrompt, buildStudentContextMessage } from './student';
import type { CourseTemplate } from '../templates';
import type { AiTutorSettings } from '../tutor-config';

/**
 * Builds a role-aware system prompt for the AI assistant. The output is stable
 * across requests (no per-request context) so it can be cached as a long-lived
 * Anthropic prompt-cache prefix. Per-request volatile context belongs in
 * `buildContextMessage` and is sent as a user-turn message.
 */
export function buildSystemPrompt(
  context: AgentContext,
  options?: { tutorSettings?: AiTutorSettings; isOrgOnPaidPlan?: boolean }
): string {
  switch (context.role) {
    case AgentRole.TEACHER:
      return buildTeacherSystemPrompt(context, { isOrgOnPaidPlan: options?.isOrgOnPaidPlan });
    case AgentRole.STUDENT:
      return buildStudentSystemPrompt(context, options?.tutorSettings);
    default:
      return buildTeacherSystemPrompt(context, { isOrgOnPaidPlan: options?.isOrgOnPaidPlan });
  }
}

/**
 * Builds the volatile per-request context (current course/lesson/exercise,
 * uploaded documents, section count, active template flow, latest approved
 * plan). Send this as a user-turn message at the front of `messages` so the
 * stable system + tools prefix stays cacheable across navigation and section
 * mutations.
 */
export function buildContextMessage(
  context: AgentContext,
  options?: { template?: CourseTemplate; approvedPlan?: unknown }
): string {
  switch (context.role) {
    case AgentRole.STUDENT:
      return buildStudentContextMessage(context);
    case AgentRole.TEACHER:
    default:
      return buildTeacherContextMessage(context, options);
  }
}

export { buildTeacherSystemPrompt, buildStudentSystemPrompt, buildTeacherContextMessage, buildStudentContextMessage };
