<script lang="ts">
  import { browser } from '$app/environment';
  import { Spinner } from '@cio/ui/base/spinner';
  import { ExerciseQuestion } from '@cio/ui';

  import { submissions } from './store';
  import { getQuestionsForSection, questionnaire } from '../store';
  import { t } from '$lib/utils/functions/translations';
  import type { Question } from '$features/course/types';
  import type { ExerciseSubmissions } from './types';
  import type { AnswerData, ExerciseQuestionLabels, ExerciseSubmissionModel } from '@cio/question-types';
  import { toExerciseQuestionModel } from '../question-type-utils';
  import { getExerciseSectionDisplayTitle } from '$features/course/utils/exercise-section-utils';

  interface Props {
    isLoading?: boolean;
  }

  let { isLoading = $bindable(true) }: Props = $props();
  const sectionFallbackTitle = $derived($t('course.navItem.lessons.exercises.all_exercises.section.fallback_title'));

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
      .map((question) => toExerciseQuestionModel(question))
  );
  const activeSections = $derived(
    [...($questionnaire.sections ?? [])].filter((section) => !section.deletedAt).sort((a, b) => a.order - b.order)
  );
  const hasSectionGroups = $derived(activeSections.length > 0);

  function getSectionPoints(questions: Question[]) {
    return questions.reduce((total, question) => total + Number(question.points ?? 0), 0);
  }
</script>

{#if isLoading}
  <Spinner />
{:else if browser}
  <div class="flex flex-col gap-6">
    <p class="mb-3 text-2xl">
      {$t('course.navItem.lessons.exercises.all_exercises.analytics.summary.question_chart')}
    </p>

    {#if hasSectionGroups}
      <div class="space-y-8">
        {#each activeSections as section, sectionIndex (section.id)}
          {@const sectionQuestions = getQuestionsForSection($questionnaire.questions, section.id)}
          <section class="space-y-4">
            <ExerciseQuestion.SectionHeader
              title={getExerciseSectionDisplayTitle({
                title: section.title,
                sectionNumber: sectionIndex + 1,
                sectionLabel: sectionFallbackTitle
              })}
              description={section.description}
              sectionNumber={sectionIndex + 1}
              totalSections={activeSections.length}
              colorTheme={section.colorTheme}
              questionCount={sectionQuestions.length}
              totalPoints={getSectionPoints(sectionQuestions)}
              labels={{
                section: $t('course.navItem.lessons.exercises.all_exercises.section.fallback_title'),
                questions: $t('course.navItem.lessons.exercises.all_exercises.view_mode.questions'),
                points: $t('course.navItem.lessons.exercises.all_exercises.view_mode.points')
              }}
            />

            <ExerciseQuestion.QuestionList
              contract={{
                mode: 'submission',
                questions: sectionQuestions.map((question) => toExerciseQuestionModel(question)),
                submissions: submissionModels,
                labels: submissionLabels,
                disabled: true
              }}
            />
          </section>
        {/each}
      </div>
    {:else}
      <ExerciseQuestion.QuestionList
        contract={{
          mode: 'submission',
          questions: submissionQuestions,
          submissions: submissionModels,
          labels: submissionLabels,
          disabled: true
        }}
      />
    {/if}
  </div>
{/if}
