<script lang="ts">
  import { getExerciseQuestionContractKey } from '@cio/question-types';
  import type { AnswerData, ExerciseQuestionModel } from '@cio/question-types';
  import type { Question } from '$features/course/types';
  import { Grade, ReasonBox } from '$features/ui/question';
  import { toExerciseQuestionModel } from './question-type-utils';
  import { getExerciseQuestionLabels } from './question-labels';
  import { ExerciseQuestion } from '@cio/ui';
  import { NumberBadge } from '@cio/ui/base/number-badge';
  import type { ExerciseSectionState, QuestionnaireMetaData } from './store';
  import { t } from '$lib/utils/functions/translations';
  import { getExerciseSectionDisplayTitle } from '$features/course/utils/exercise-section-utils';

  interface Props {
    questions?: Question[];
    sections?: ExerciseSectionState[];
    questionnaireMetaData?: Partial<QuestionnaireMetaData>;
    /** Per-question scores (e.g. from `questionnaireMetaData.grades` or grading modal `questionAnswerByPoint`). */
    grades?: Record<string, number>;
    disableGrading?: boolean;
    isGradeWithAI?: boolean;
    isLoading?: boolean;
    /** Optional AI grading copy keyed by question id. */
    reasons?: Record<string, string>;
  }

  let {
    questions = [],
    sections = [],
    questionnaireMetaData: _questionnaireMetaData = {},
    grades = $bindable({}),
    disableGrading = true,
    isGradeWithAI = $bindable(false),
    isLoading = $bindable(false),
    reasons = $bindable({})
  }: Props = $props();

  function acceptGradeSuggestion() {
    isGradeWithAI = false;
  }

  function rejectGradeSuggestion(questionId: Question['id']) {
    isGradeWithAI = false;
    grades[String(questionId)] = 0;
  }

  function getAnswerForQuestion(questionModel: ExerciseQuestionModel, fallbackIndex = 0): AnswerData | undefined {
    const questionKey = getExerciseQuestionContractKey(questionModel, fallbackIndex);
    return _questionnaireMetaData?.answers?.[questionKey];
  }

  const questionModels = $derived(questions.map((question) => toExerciseQuestionModel(question)));
  const questionLabels = $derived(getExerciseQuestionLabels());
  const sectionFallbackTitle = $derived($t('course.navItem.lessons.exercises.all_exercises.section.fallback_title'));
  const activeSections = $derived(sections.filter((section) => !section.deletedAt).sort((a, b) => a.order - b.order));
  const hasSectionGroups = $derived(activeSections.length > 0);
  const answersByKey = $derived(
    questionModels.reduce(
      (acc, questionModel, index) => {
        const questionKey = getExerciseQuestionContractKey(questionModel, index);
        acc[questionKey] = _questionnaireMetaData?.answers?.[questionKey];
        return acc;
      },
      {} as Record<string, AnswerData>
    )
  );

  function getQuestionsForSection(exerciseSectionId: string) {
    return questions.filter((question) => !question.deletedAt && question.exerciseSectionId === exerciseSectionId);
  }

  function getSectionPoints(sectionQuestions: Question[]) {
    return sectionQuestions.reduce((total, question) => total + Number(question.points ?? 0), 0);
  }
</script>

{#if hasSectionGroups}
  <div class="space-y-6">
    {#each activeSections as section, sectionIndex (section.id)}
      {@const sectionQuestions = getQuestionsForSection(section.id)}
      {@const sectionQuestionModels = sectionQuestions.map((question) => toExerciseQuestionModel(question))}
      <section class="space-y-4 pt-4">
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
            mode: disableGrading ? 'review' : 'review',
            questions: sectionQuestionModels,
            answersByKey,
            labels: questionLabels,
            disabled: true
          }}
          itemClass="mb-4"
        />
      </section>
    {/each}
  </div>
{:else if disableGrading && !Object.keys(grades || {}).length}
  <ExerciseQuestion.QuestionList
    contract={{ mode: 'review', questions: questionModels, answersByKey, labels: questionLabels, disabled: true }}
    itemClass="mb-4"
  />
{:else if disableGrading && Object.keys(grades || {}).length}
  {#each questions as currentQuestion, index (currentQuestion.id)}
    {@const questionModel = questionModels[index]}
    <div class="mb-4 space-y-3">
      <div class="flex items-center justify-between gap-2">
        <NumberBadge number={index + 1} active />
        <Grade grade={grades[currentQuestion.id]} gradeMax={currentQuestion.points} disableGrading={true} />
      </div>

      <ExerciseQuestion.QuestionRenderer
        contract={{
          mode: 'review',
          question: questionModel,
          answer: getAnswerForQuestion(questionModel, index),
          labels: questionLabels,
          disabled: true
        }}
      />
    </div>
  {/each}
{:else}
  {#each questions as currentQuestion, index (currentQuestion.id)}
    {@const questionModel = questionModels[index]}
    <div class="mb-4 space-y-3">
      <div class="flex items-center justify-between gap-2">
        <NumberBadge number={index + 1} active />
        <Grade bind:grade={grades[currentQuestion.id]} gradeMax={currentQuestion.points} {disableGrading} />
      </div>

      <ExerciseQuestion.QuestionRenderer
        contract={{
          mode: 'review',
          question: questionModel,
          answer: getAnswerForQuestion(questionModel, index),
          labels: questionLabels,
          disabled: true
        }}
      />

      {#if isGradeWithAI}
        <ReasonBox
          reason={reasons[currentQuestion.id]}
          {isLoading}
          acceptGrade={acceptGradeSuggestion}
          rejectGrade={() => rejectGradeSuggestion(currentQuestion.id)}
        />
      {/if}
    </div>
  {/each}
{/if}
