import { convertToModelMessages, streamText, type UIMessage } from 'ai';

import { listLearnerAssignments } from '@api/services/account/assignments';
import { listLearnerLiveClasses } from '@api/services/account/live-classes';
import { enforceLearnerAssistantPolicy, incrementStudentTutorCount } from '@api/services/agent/tutor-usage';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { AIProvider } from '@cio/ai-assistant';
import { buildLearnerAssistantSystemPrompt } from '@cio/ai-assistant/prompt';
import { createModel, getProviderConfigForProvider } from '@cio/ai-assistant/providers';
import { getLearnerGoalSummary } from '@cio/core/services/learner/goals';
import { recordTokenUsage } from '@cio/core/services/agent/usage';
import { getProfileById } from '@cio/db/queries/auth';
import { getEnrolledCourses, type TStudentCourse } from '@cio/db/queries/course/course';
import { AGENT_MODELS, DEFAULT_PICKER_MODEL_ID } from '@cio/utils/agent-models';

const CONTEXT_ASSIGNMENT_LIMIT = 10;
const CONTEXT_LIVE_CLASS_LIMIT = 5;

function courseProgressPercent(course: TStudentCourse): number {
  const total = course.lessonCount + course.exerciseCount;
  if (total === 0) return 0;

  return Math.round(((course.progressRate + course.exercisesCompleted) / total) * 100);
}

/** The course the assistant's usage is recorded against: the first unfinished course, else the first one. */
function pickUsageCourse(courses: TStudentCourse[]): TStudentCourse | undefined {
  return courses.find((course) => courseProgressPercent(course) < 100) ?? courses[0];
}

async function buildLearnerContext(orgId: string, profileId: string, courses: TStudentCourse[]): Promise<string> {
  const [profile, goals, assignments, liveClasses] = await Promise.all([
    getProfileById(profileId),
    getLearnerGoalSummary({ organizationId: orgId, profileId }),
    listLearnerAssignments(orgId, profileId),
    listLearnerLiveClasses(orgId, profileId)
  ]);

  const courseLines = courses.map((course) => {
    const due = course.complianceDueDate ? `, compliance due ${course.complianceDueDate}` : '';

    return `- ${course.title} (${course.type}): ${courseProgressPercent(course)}% complete, ${course.progressRate} of ${course.lessonCount} lessons, ${course.exercisesCompleted} of ${course.exerciseCount} exercises${due}`;
  });
  const assignmentLines = assignments
    .slice(0, CONTEXT_ASSIGNMENT_LIMIT)
    .map(
      (assignment) =>
        `- ${assignment.title} in ${assignment.course.title}: ${assignment.status}${assignment.dueAt ? `, due ${assignment.dueAt}` : ''}${assignment.score !== null ? `, scored ${assignment.score} of ${assignment.maxScore}` : ''}`
    );
  const liveClassLines = liveClasses
    .slice(0, CONTEXT_LIVE_CLASS_LIMIT)
    .map(
      (liveClass) =>
        `- ${liveClass.title} in ${liveClass.course.title}: starts ${liveClass.startsAt}${liveClass.isRegistered ? ', registered' : ''}`
    );

  return `# Learner Context

Now: ${new Date().toISOString()} (learner time zone: ${goals.timezone})
Learner: ${profile?.fullname || 'Unknown'}

## Courses
${courseLines.join('\n') || '- None'}

## Assignments
${assignmentLines.join('\n') || '- None'}

## Upcoming live classes
${liveClassLines.join('\n') || '- None'}

## Goals
- Current streak: ${goals.streak.current} days (best ${goals.streak.best}), active today: ${goals.streak.activeToday ? 'yes' : 'no'}
- Weekly lesson goal: ${goals.weeklyGoal.completed} of ${goals.weeklyGoal.target} lessons this week (week started ${goals.weeklyGoal.weekStart})
- Next streak milestone: ${goals.milestones.find((milestone) => !milestone.achieved)?.days ?? 'all reached'} days`;
}

/**
 * Streams an answer from the learner's organization-wide assistant about their courses, progress, assignments, live
 * classes and goals. It follows the workspace AI tutor settings and counts toward the learner's tutor allowance.
 */
export async function streamLearnerAssistantReply(params: {
  orgId: string;
  profileId: string;
  messages: UIMessage[];
}): Promise<Response> {
  const { orgId, profileId } = params;
  const courses = await getEnrolledCourses({ orgId, profileId });
  const usageCourse = pickUsageCourse(courses.filter((course) => course.isPublished));
  if (!usageCourse) {
    throw new AppError('Enroll in a course to use the assistant', ErrorCodes.LEARNER_ASSISTANT_NO_COURSES, 400);
  }

  const policy = await enforceLearnerAssistantPolicy(orgId, usageCourse.id, profileId);

  const modelDescriptor = AGENT_MODELS[DEFAULT_PICKER_MODEL_ID];
  const baseProviderConfig = getProviderConfigForProvider(modelDescriptor.provider as AIProvider);
  if (!baseProviderConfig) {
    throw new AppError('AI assistant is not configured', 'AI_NOT_CONFIGURED', 503);
  }

  const providerConfig = { ...baseProviderConfig, model: modelDescriptor.backendModelId };
  const learnerContext = await buildLearnerContext(orgId, profileId, courses);
  const modelMessages = await convertToModelMessages(params.messages);

  const result = streamText({
    model: createModel(providerConfig),
    maxRetries: 2,
    system: buildLearnerAssistantSystemPrompt(policy.settings),
    messages: [{ role: 'user', content: [{ type: 'text', text: learnerContext }] }, ...modelMessages],
    onFinish: async ({ totalUsage }) => {
      const promptTokens = totalUsage?.inputTokens ?? 0;
      const completionTokens = totalUsage?.outputTokens ?? 0;

      await recordTokenUsage(
        orgId,
        profileId,
        usageCourse.id,
        { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens },
        providerConfig.model || providerConfig.provider
      );
      await incrementStudentTutorCount(orgId, profileId, usageCourse.id);
    }
  });

  return result.toUIMessageStreamResponse();
}
