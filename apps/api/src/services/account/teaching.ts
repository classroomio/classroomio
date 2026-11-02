import {
  QUESTION_TYPE_ID_TO_KEY,
  dbQuestionToExerciseQuestionModel,
  getQuestionTypeById,
  resolveTrueFalseCorrectValue,
  scoreAnswerForQuestion,
  type AnswerData,
  type QuestionTypeKey
} from '@cio/question-types';
import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  getAnsweredQuestionTypeIdsBySubmission,
  getCourseStudentCounts,
  getGradableCoursesInOrg,
  getUngradedSubmissionsForCourses
} from '@cio/db/queries/submission/grading-queue';
import { getSubmission, resolveSubmissionGradingState } from '@api/services/submission/submission';

import { canAccessCourseSubmissions } from '@cio/db/queries/group';
import { getCourseComplianceOverview } from '@api/services/course/compliance';
import { getCourseWithOrgData } from '@cio/db/queries/course';
import { getExerciseWithRelationsOptimized } from '@cio/db/queries/exercise';
import { getProfileByGroupMemberId } from '@cio/db/queries/course/people';

type GradingState = ReturnType<typeof resolveSubmissionGradingState>;

function isSubmittedLate(submittedAt: string | null, dueBy: string | null) {
  if (!submittedAt || !dueBy) return false;

  return new Date(submittedAt).getTime() > new Date(dueBy).getTime();
}

function questionTypeKeysOf(typeIds: number[]): QuestionTypeKey[] {
  const keys = typeIds.map((typeId) => QUESTION_TYPE_ID_TO_KEY[typeId]).filter((key): key is QuestionTypeKey => !!key);

  return [...new Set(keys)];
}

/**
 * Ungraded submissions across every course in the organization the profile can grade, oldest first.
 */
export async function listGradingQueue(orgId: string, profileId: string, isOrgAdmin: boolean) {
  try {
    const courses = await getGradableCoursesInOrg(orgId, profileId, isOrgAdmin);
    const courseTitleById = new Map(courses.map((course) => [course.id, course.title]));
    const submissions = await getUngradedSubmissionsForCourses(courses.map((course) => course.id));
    const typeIdsBySubmission = await getAnsweredQuestionTypeIdsBySubmission(submissions.map((row) => row.id));

    return submissions.map((row) => {
      const gradingState: GradingState = resolveSubmissionGradingState(row);
      const answerTypes = questionTypeKeysOf(typeIdsBySubmission.get(row.id) ?? []);

      return {
        id: row.id,
        courseId: row.courseId ?? '',
        courseTitle: (row.courseId && courseTitleById.get(row.courseId)) || '',
        exerciseId: row.exerciseId,
        exerciseTitle: row.exerciseTitle,
        submittedAt: row.createdAt,
        isLate: isSubmittedLate(row.createdAt, row.exerciseDueBy),
        gradingState,
        answerTypes,
        student: row.student?.profileId
          ? {
              id: row.student.profileId,
              fullname: row.student.fullname || row.student.username || '',
              avatarUrl: row.student.avatarUrl
            }
          : null
      };
    });
  } catch (error) {
    if (error instanceof AppError) throw error;

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to load the grading queue',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * One submission with its exercise questions, the learner's answers (file and video answers carry presigned URLs) and
 * the points to start grading from: stored points, or the automatic score for auto-gradable questions.
 * Throws 404 when the submission is outside the organization and 403 when the profile cannot grade its course.
 */
export async function getGradingQueueSubmission(orgId: string, profileId: string, submissionId: string) {
  try {
    const submission = await getSubmission(submissionId);
    const courseId = submission.courseId;
    const courseWithOrg = courseId ? await getCourseWithOrgData(courseId) : null;

    if (!courseId || !courseWithOrg || courseWithOrg.orgId !== orgId) {
      throw new AppError('Submission not found', ErrorCodes.SUBMISSION_NOT_FOUND, 404);
    }

    const canGrade = await canAccessCourseSubmissions(courseId, profileId);
    if (!canGrade) {
      throw new AppError('You cannot grade submissions in this course', ErrorCodes.UNAUTHORIZED, 403);
    }

    const [exerciseWithRelations, student] = await Promise.all([
      getExerciseWithRelationsOptimized(submission.exerciseId),
      submission.submittedBy ? getProfileByGroupMemberId(submission.submittedBy) : Promise.resolve(null)
    ]);
    const exercise = exerciseWithRelations.exercise;

    const answerRowByQuestionId = new Map<number, { answerData: AnswerData | null; point: number | null }>(
      (submission.answers ?? []).map(
        (row: { questionId: number; answerData: AnswerData | null; point: number | null }) => [
          Number(row.questionId),
          { answerData: row.answerData ?? null, point: row.point }
        ]
      )
    );

    const questions = exerciseWithRelations.questions
      .filter((question): question is typeof question & { id: number } => question.id != null)
      .map((question) => {
        const type: QuestionTypeKey = QUESTION_TYPE_ID_TO_KEY[question.questionTypeId] ?? 'TEXTAREA';
        const autoGradable = getQuestionTypeById(question.questionTypeId)?.autoGradable === true;
        const settings =
          question.settings && typeof question.settings === 'object' && !Array.isArray(question.settings)
            ? (question.settings as Record<string, unknown>)
            : {};
        const options = (question.options ?? []).map((option) => ({
          id: Number(option.id),
          label: option.label ?? '',
          isCorrect: option.isCorrect === true
        }));
        const answerRow = answerRowByQuestionId.get(question.id);
        const answer = answerRow?.answerData ?? null;
        const storedPoints = answerRow?.point ?? 0;
        const model = dbQuestionToExerciseQuestionModel({
          id: question.id,
          title: question.title,
          questionTypeId: question.questionTypeId,
          points: question.points ?? 0,
          settings,
          options: question.options ?? []
        });
        const automaticPoints = autoGradable ? Math.round(scoreAnswerForQuestion(model, answer)) : null;
        const startingPoints = storedPoints > 0 ? storedPoints : automaticPoints;

        return {
          id: question.id,
          title: question.title ?? '',
          order: Number(question.order ?? 0),
          type,
          points: Number(question.points ?? 0),
          autoGradable,
          hasAnswerRow: answerRow !== undefined,
          startingPoints,
          options,
          correctValue: type === 'TRUE_FALSE' ? resolveTrueFalseCorrectValue(settings, question.options ?? []) : null,
          answer
        };
      });

    const maxPoints = questions.reduce((sum, question) => sum + question.points, 0);

    return {
      id: submission.id,
      courseId,
      courseTitle: courseWithOrg.courseTitle ?? '',
      exerciseId: submission.exerciseId,
      exerciseTitle: exercise.title,
      allowMultipleAttempts: exercise.allowMultipleAttempts,
      submittedAt: submission.createdAt,
      isLate: isSubmittedLate(submission.createdAt, exercise.dueBy ?? null),
      gradingState: resolveSubmissionGradingState(submission) as GradingState,
      feedback: submission.feedback,
      total: submission.total ?? 0,
      maxPoints,
      student: student
        ? { id: student.id, fullname: student.fullname || student.username || '', avatarUrl: student.avatarUrl }
        : null,
      questions
    };
  } catch (error) {
    if (error instanceof AppError) throw error;

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to load the submission',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

async function countOverdueLearners(courseId: string) {
  try {
    const overview = await getCourseComplianceOverview(courseId);

    return overview.summary.nonCompliant + overview.summary.inGracePeriod;
  } catch {
    return null;
  }
}

/**
 * The courses in the organization the profile teaches, each with enrollment, recorded completions, ungraded
 * submissions and, for compliance courses, learners past their due date (non-compliant or in a grace period).
 */
export async function listTeachingCourses(orgId: string, profileId: string, isOrgAdmin: boolean) {
  try {
    const courses = await getGradableCoursesInOrg(orgId, profileId, isOrgAdmin);
    const courseIds = courses.map((course) => course.id);
    const [studentCounts, ungraded] = await Promise.all([
      getCourseStudentCounts(courseIds),
      getUngradedSubmissionsForCourses(courseIds)
    ]);

    const countsByCourseId = new Map(studentCounts.map((row) => [row.courseId, row]));
    const ungradedByCourseId = new Map<string, number>();
    for (const row of ungraded) {
      if (!row.courseId) continue;

      ungradedByCourseId.set(row.courseId, (ungradedByCourseId.get(row.courseId) ?? 0) + 1);
    }

    const overdueCounts = await Promise.all(
      courses.map((course) => (course.type === 'COMPLIANCE' ? countOverdueLearners(course.id) : Promise.resolve(null)))
    );

    return courses.map((course, index) => {
      const counts = countsByCourseId.get(course.id);
      const enrolled = Number(counts?.enrolled ?? 0);
      const completed = Number(counts?.completed ?? 0);

      return {
        id: course.id,
        title: course.title,
        type: course.type,
        bannerImage: course.bannerImage,
        logo: course.logo,
        enrolled,
        completed,
        completionRate: enrolled > 0 ? Math.round((completed / enrolled) * 100) : 0,
        overdue: overdueCounts[index] ?? null,
        toGrade: ungradedByCourseId.get(course.id) ?? 0
      };
    });
  } catch (error) {
    if (error instanceof AppError) throw error;

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to load taught courses',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}
