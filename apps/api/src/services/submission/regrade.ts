import type { AnswerData } from '@cio/question-types';
import { QUESTION_TYPE_IDS, getQuestionTypeById, roundPoints } from '@cio/question-types';
import { getExerciseWithRelationsOptimized } from '@cio/db/queries/exercise';
import {
  getSubmissionsByCourseIdWithDetails,
  updateQuestionAnswer,
  updateSubmission
} from '@cio/db/queries/submission';

import { getAnswerableQuestions, regradeStoredAnswer, toScoringQuestions } from './auto-grading';

export type RegradeResult = { submissionsChecked: number; submissionsChanged: number; answersChanged: number };

/**
 * Re-scores every stored answer of an exercise against its current answer key, so a corrected key reaches students who
 * already submitted. Points a teacher gave to manually graded questions, and to the working part of worked solutions,
 * are kept. Updates each answer's stored grading and each submission's total.
 */
export async function regradeExerciseSubmissions(courseId: string, exerciseId: string): Promise<RegradeResult> {
  const { questions } = await getExerciseWithRelationsOptimized(exerciseId);
  const scoringQuestions = toScoringQuestions(getAnswerableQuestions(questions));
  const regradableById = new Map(
    scoringQuestions
      .filter((question) => {
        const meta = getQuestionTypeById(question.questionTypeId);

        return meta?.autoGradable === true || question.questionTypeId === QUESTION_TYPE_IDS.WORKED_SOLUTION;
      })
      .map((question) => [question.id, question])
  );
  const submissions = await getSubmissionsByCourseIdWithDetails(courseId, exerciseId);
  const result: RegradeResult = { submissionsChecked: submissions.length, submissionsChanged: 0, answersChanged: 0 };

  for (const submission of submissions) {
    let total = 0;
    let changedInSubmission = 0;

    for (const stored of submission.answers) {
      const question = regradableById.get(stored.questionId);
      const storedPoints = Number(stored.point ?? 0);
      const answerData = stored.answerData as AnswerData | null;
      const regraded = question && answerData ? regradeStoredAnswer(question, answerData, storedPoints) : null;
      if (!regraded) {
        total += storedPoints;
        continue;
      }

      const isChanged =
        regraded.points !== storedPoints || JSON.stringify(regraded.answer) !== JSON.stringify(answerData);
      if (isChanged) {
        await updateQuestionAnswer(submission.id, stored.questionId, {
          point: regraded.points,
          answerData: regraded.answer
        });
        changedInSubmission += 1;
      }

      total += regraded.points;
    }

    if (changedInSubmission === 0) continue;

    await updateSubmission(submission.id, { total: roundPoints(total) });
    result.submissionsChanged += 1;
    result.answersChanged += changedInSubmission;
  }

  return result;
}
