<script lang="ts">
  import { browser } from '$app/environment';
  import { Spinner } from '@cio/ui/base/spinner';
  import { ExerciseQuestion } from '@cio/ui';

  import { submissions } from './store';
  import { questionnaire } from '../store';
  import { t } from '$lib/utils/functions/translations';
  import type { Question } from '$features/course/types';
  import type { ExerciseSubmissions } from './types';
  import type { AnswerData, ExerciseQuestionLabels, ExerciseSubmissionModel } from '@cio/question-types';
  import { toExerciseQuestionModel } from '../question-type-utils';

  interface Props {
    isLoading?: boolean;
  }

  let { isLoading = $bindable(true) }: Props = $props();

  function toAnswerData(answerData: unknown): AnswerData | null {
    if (!answerData || typeof answerData !== 'object' || !('type' in answerData)) return null;
    return answerData as AnswerData;
  }

  function toSubmissionModel(submission: ExerciseSubmissions): ExerciseSubmissionModel {
    return {
      id: submission.id,
      studentName: submission.groupmember?.profile.fullname,
      studentAvatarUrl: submission.groupmember?.profile.avatarUrl,
      answers: submission.answers.map((answer) => ({
        questionId: answer.questionId,
        answerData: toAnswerData(answer.answerData)
      }))
    };
  }

  function toSubmissionQuestionModel(question: Question, index: number) {
    return {
      ...toExerciseQuestionModel(question),
      title: `${index + 1}. ${question.title || ''}`
    };
  }

  const submissionLabels = $derived.by(
    (): ExerciseQuestionLabels => ({
      'submission.common.no_answer': $t('course.navItem.lessons.exercises.all_exercises.analytics.individual.no'),
      'submission.common.other': $t('course.navItem.lessons.exercises.all_exercises.analytics.summary.other'),
      'submission.chart.responses': $t('course.navItem.lessons.exercises.all_exercises.analytics.summary.responses'),
      'submission.chart.no_data': $t('course.navItem.lessons.exercises.all_exercises.analytics.summary.no_responses'),
      'submission.list.responses': $t('course.navItem.lessons.exercises.all_exercises.analytics.summary.responses'),
      'submission.list.no_responses': $t(
        'course.navItem.lessons.exercises.all_exercises.analytics.summary.no_responses'
      )
    })
  );

  const submissionModels = $derived($submissions.map((submission) => toSubmissionModel(submission)));

  const submissionQuestions = $derived(
    $questionnaire.questions
      .filter((question) => !question.deletedAt)
      .map((question, index) => toSubmissionQuestionModel(question, index))
  );
</script>

{#if isLoading}
  <Spinner />
{:else if browser}
  <div class="flex flex-col gap-6">
    <p class="mb-3 text-2xl">
      {$t('course.navItem.lessons.exercises.all_exercises.analytics.summary.question_chart')}
    </p>

    <ExerciseQuestion.QuestionList
      contract={{
        mode: 'submission',
        questions: submissionQuestions,
        submissions: submissionModels,
        labels: submissionLabels,
        disabled: true
      }}
    />
  </div>
{/if}
