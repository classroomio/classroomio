<script lang="ts">
  import { get } from 'svelte/store';
  import { untrack } from 'svelte';
  import { fly } from 'svelte/transition';
  import { courseApi } from '$features/course/api';
  import { questionnaire, questionnaireMetaData } from './store';
  import Preview from './preview.svelte';
  import { ExerciseQuestion } from '@cio/ui';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import { Spinner } from '@cio/ui/base/spinner';
  import { RoleBasedSecurity } from '$features/ui';
  import { Empty } from '@cio/ui/custom/empty';
  import FileQuestionIcon from '@lucide/svelte/icons/file-question';
  import { Progress } from '@cio/ui/base/progress';
  import { removeDuplicate } from '$lib/utils/functions/removeDuplicate';
  import { getExerciseQuestionContractKey } from '@cio/question-types';
  import { STATUS } from './constants';
  import { filterOutDeleted, wasCorrectAnswerSelected } from './functions';
  import { formatAnswers, getGroupMemberId } from '$features/course/utils/functions';
  import { exerciseApi, submissionApi } from '$features/course/api';
  import { profile } from '$lib/utils/store/user';
  import { sanitizeHtml } from '@cio/ui/tools/sanitize';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import { ContentType } from '@cio/utils/constants/content';
  import { getQuestionTypeKey, questionTypeSupportsOptions, toExerciseQuestionModel } from './question-type-utils';
  import { getExerciseQuestionLabels } from './question-labels';

  interface Props {
    preview?: boolean;
    exerciseId?: string;
    isFetchingExercise?: boolean;
  }

  let { preview = false, exerciseId = '', isFetchingExercise = false }: Props = $props();

  let submission;
  let hasSubmission = $state(false);
  let isSubmitting = $state(false);
  let isCheckingSubmission = $state(false);
  let isLoadingAutoSavedData = $state(false);
  let alreadyCheckedAutoSavedData = $state(false);
  let prevExerciseId = $state('');
  const questionLabels = $derived(getExerciseQuestionLabels());

  function handleStart() {
    questionnaireMetaData.update((m) => ({ ...m, currentQuestionIndex: m.currentQuestionIndex + 1 }));
  }

  function normalizeAnswerValue(previousValue, nextValue) {
    if (typeof nextValue === 'string' || typeof nextValue === 'number' || typeof nextValue === 'boolean') {
      return nextValue;
    }

    if (Array.isArray(nextValue)) {
      const previousList = Array.isArray(previousValue) ? previousValue : [];
      return removeDuplicate([...previousList, ...nextValue]);
    }

    if (nextValue && typeof nextValue === 'object') {
      return nextValue;
    }

    return previousValue;
  }

  function mapAnswerToApiPayload(question, answerValue) {
    const questionId = Number(question.id);
    if (Number.isNaN(questionId)) return null;

    const isOptionBasedQuestion = questionTypeSupportsOptions(getQuestionTypeKey(question));

    if (isOptionBasedQuestion) {
      const optionValues = Array.isArray(answerValue) ? answerValue : [answerValue];
      const rawValue = optionValues[0];

      if (rawValue !== undefined && rawValue !== null && rawValue !== '') {
        let optionId = Number.NaN;
        const normalizedRawValue = String(rawValue).trim().toLowerCase();

        if (question.options?.length) {
          const option = question.options.find((item) => {
            const candidateId = item.id != null ? String(item.id) : '';
            const candidateValue = item.value != null ? String(item.value) : '';
            const candidateLabel = item.label != null ? String(item.label) : '';

            return (
              candidateId === String(rawValue) ||
              candidateValue === String(rawValue) ||
              candidateLabel === String(rawValue) ||
              candidateValue.trim().toLowerCase() === normalizedRawValue ||
              candidateLabel.trim().toLowerCase() === normalizedRawValue
            );
          });
          optionId = option?.id != null ? Number(option.id) : Number.NaN;
        }

        if (Number.isNaN(optionId)) {
          optionId = Number(rawValue);
        }

        if (!Number.isNaN(optionId)) {
          return { questionId, optionId };
        }
      }
    }

    if (typeof answerValue === 'string') {
      return { questionId, answer: answerValue };
    }

    if (typeof answerValue === 'number' || typeof answerValue === 'boolean') {
      return { questionId, answer: String(answerValue) };
    }

    if (Array.isArray(answerValue)) {
      if (answerValue.length === 0) return null;

      return { questionId, answer: JSON.stringify(answerValue) };
    }

    if (answerValue && typeof answerValue === 'object') {
      return { questionId, answer: JSON.stringify(answerValue) };
    }

    return null;
  }

  async function onSubmit(id, value) {
    if (!courseApi.course?.id) return;

    const { answers } = $questionnaireMetaData;
    const { questions } = $questionnaire;
    const prevAnswer = answers[id];
    const formattedAnswer = normalizeAnswerValue(prevAnswer, value);

    const newAnswers = { ...answers, [id]: formattedAnswer };
    questionnaireMetaData.update((m) => ({ ...m, answers: newAnswers }));

    const isCorrect = wasCorrectAnswerSelected(currentQuestion, newAnswers);
    const currentIndex = $questionnaireMetaData.currentQuestionIndex;
    const isFinished = !questions[currentIndex];

    if (isCorrect) {
      setTimeout(async () => {
        questionnaireMetaData.update((m) => ({ ...m, currentQuestionIndex: m.currentQuestionIndex + 1 }));
        const updated = get(questionnaireMetaData);
        localStorage.setItem(`autosave-exercise-${exerciseId}`, JSON.stringify(updated));

        // If last question send to server (guard against double submit e.g. double-click)
        if (isFinished) {
          if (isSubmitting) return;
          isSubmitting = true;

          localStorage.removeItem(`autosave-exercise-${exerciseId}`);
          const totalPossibleGrade = getTotalPossibleGrade($questionnaire.questions);

          // Transform answers to API format
          const answersForApi = Object.entries(updated.answers)
            .map(([questionKey, val]) => {
              const question = questions.find(
                (item) => getExerciseQuestionContractKey(toExerciseQuestionModel(item)) === questionKey
              );
              if (!question) return null;
              return mapAnswerToApiPayload(question, val);
            })
            .filter((answer) => answer !== null) as Array<{ questionId: number; optionId?: number; answer?: string }>;

          if (answersForApi.length === 0) {
            isSubmitting = false;
            snackbar.error(t.get('course.navItem.lessons.exercises.all_exercises.view_mode.answers_required'));
            return;
          }

          await exerciseApi.submit(courseApi.course?.id!, exerciseId, answersForApi);

          if (exerciseApi.success) {
            questionnaireMetaData.update((m) => ({
              ...m,
              status: 1,
              totalPossibleGrade,
              grades: {},
              comment: '',
              isFinished: true,
              exerciseId
            }));
            courseApi.updateContentItem(exerciseId, ContentType.Exercise, { isComplete: true });
          } else {
            isSubmitting = false;
          }
        }
      }, 1000);
    }
  }

  function onPrevious() {
    questionnaireMetaData.update((m) => ({ ...m, currentQuestionIndex: m.currentQuestionIndex - 1 }));
  }

  function getProgressValue(currentQuestionIndex) {
    if ($questionnaireMetaData.isFinished) {
      return 100;
    }

    return Math.round(((currentQuestionIndex - 1) / $questionnaire.questions.length) * 100) || 0;
  }

  function getTotalPossibleGrade(questions) {
    return questions.reduce((acc, question) => {
      acc += parseFloat(question.points);
      return acc;
    }, 0);
  }

  async function checkForSubmission(people, profileId?: string, courseId?: string) {
    if (!Array.isArray(people) || !profileId || !courseId || !!submission) {
      return;
    }

    hasSubmission = true;
    isCheckingSubmission = true;

    try {
      const submittedBy = getGroupMemberId(people, profileId);
      await submissionApi.list(courseId, exerciseId, submittedBy);
      const data = submissionApi.data;

      if (Array.isArray(data) && data.length) {
        submission = data[0];

        const totalPossibleGrade = getTotalPossibleGrade($questionnaire.questions);
        let finalTotalGrade = 0;
        const grades = submission.answers.reduce(
          (acc: Record<string, number>, answer: { question_id: number; point: number }) => {
            acc[answer.question_id] = answer.point;
            finalTotalGrade += answer.point;
            return acc;
          },
          {}
        );

        questionnaireMetaData.update((m) => ({
          ...m,
          answers: formatAnswers({
            questions: $questionnaire.questions,
            answers: submission.answers
          }),
          totalPossibleGrade,
          currentQuestionIndex: $questionnaire.questions.length,
          isFinished: true,
          status: submission.status_id,
          finalTotalGrade,
          comment: submission.feedback,
          grades,
          exerciseId
        }));
        courseApi.updateContentItem(exerciseId, ContentType.Exercise, { isComplete: true });
      }
    } finally {
      isCheckingSubmission = false;
    }
  }

  function getAutoSavedData() {
    isLoadingAutoSavedData = true;

    const stringifiedQuestionnaireMetaData = localStorage.getItem(`autosave-exercise-${exerciseId}`);

    if (stringifiedQuestionnaireMetaData) {
      const autoSavedData = JSON.parse(stringifiedQuestionnaireMetaData);
      if (autoSavedData) {
        questionnaireMetaData.set(autoSavedData);
      }
    }
    isLoadingAutoSavedData = false;
    alreadyCheckedAutoSavedData = true;
  }

  function hasAnswerValue(answerValue) {
    if (answerValue === null || answerValue === undefined) return false;
    if (typeof answerValue === 'string') return answerValue.trim().length > 0;
    if (Array.isArray(answerValue)) return answerValue.length > 0;
    return true;
  }

  function onSharedAnswerChange(answerValue) {
    if (!sharedCurrentQuestionKey) return;

    questionnaireMetaData.update((metaData) => ({
      ...metaData,
      answers: {
        ...metaData.answers,
        [sharedCurrentQuestionKey]: answerValue
      }
    }));
  }

  function onSharedNext() {
    if (!sharedCurrentQuestionKey) return;
    onSubmit(sharedCurrentQuestionKey, sharedCurrentAnswer);
  }

  $effect(() => {
    if (!alreadyCheckedAutoSavedData) {
      getAutoSavedData();
    }
  });

  const progressValue = $derived(getProgressValue($questionnaireMetaData.currentQuestionIndex));
  const currentQuestion = $derived($questionnaire.questions[$questionnaireMetaData.currentQuestionIndex - 1]);
  const isExerciseLoaded = $derived(alreadyCheckedAutoSavedData && $questionnaire.questions.length > 0);
  const isFinished = $derived(isExerciseLoaded && $questionnaireMetaData.currentQuestionIndex > 0 && !currentQuestion);
  const sharedQuestionModel = $derived(currentQuestion ? toExerciseQuestionModel(currentQuestion) : null);
  const sharedCurrentQuestionKey = $derived(
    sharedQuestionModel ? getExerciseQuestionContractKey(sharedQuestionModel) : null
  );
  const sharedCurrentAnswer = $derived(
    sharedCurrentQuestionKey ? $questionnaireMetaData.answers[sharedCurrentQuestionKey] : undefined
  );
  const canGoNextForSharedQuestion = $derived(hasAnswerValue(sharedCurrentAnswer));

  $effect(() => {
    const finished = isFinished;

    untrack(() => {
      $questionnaireMetaData.isFinished = finished;
    });
  });

  $effect(() => {
    const progress = progressValue;

    untrack(() => {
      $questionnaireMetaData.progressValue = progress;
    });
  });

  $effect(() => {
    if (isFetchingExercise || hasSubmission) return;

    checkForSubmission(courseApi.group.people, $profile.id, courseApi.course?.id);
  });

  $effect(() => {
    if (prevExerciseId === exerciseId) return;

    if (!!prevExerciseId) {
      submission = undefined;
      hasSubmission = false;
      isSubmitting = false;
      isCheckingSubmission = false;
      alreadyCheckedAutoSavedData = false;
    }

    prevExerciseId = exerciseId;
  });
</script>

{#if !preview && $questionnaire.questions.length && !$questionnaireMetaData.isFinished}
  <Progress value={$questionnaireMetaData.progressValue} />
{/if}

{#if preview}
  <RoleBasedSecurity allowedRoles={[1, 2]}>
    <Preview questions={filterOutDeleted($questionnaire.questions)} questionnaireMetaData={$questionnaireMetaData} />
  </RoleBasedSecurity>
{:else if !$questionnaire.questions.length}
  <Empty
    title={$t('course.navItem.lessons.exercises.all_exercises.view_mode.no_question')}
    icon={FileQuestionIcon}
    variant="page"
  >
    <RoleBasedSecurity allowedRoles={[1, 2]}>
      <p class="ui:text-primary text-center text-sm">
        {$t('course.navItem.lessons.exercises.all_exercises.view_mode.empty_edit_hint_prefix')}

        <span class="font-semibold">
          {$t('course.navItem.lessons.exercises.all_exercises.view_mode.edit')}
        </span>

        {$t('course.navItem.lessons.exercises.all_exercises.view_mode.empty_edit_hint_suffix')}
      </p>
    </RoleBasedSecurity>
  </Empty>
{:else if $questionnaireMetaData.currentQuestionIndex === 0}
  <RoleBasedSecurity allowedRoles={[3]}>
    <div>
      {#if isCheckingSubmission}
        <div class="flex flex-col items-center justify-center gap-4 py-12">
          <Spinner class="size-10" />
          <p class="ui:text-muted-foreground text-sm">
            {$t('course.navItem.lessons.exercises.all_exercises.view_mode.checking_submission')}
          </p>
        </div>
      {:else}
        <h2 class="my-1">{$questionnaire.title}</h2>

        <div class="flex items-center">
          <p class="mx-2 dark:text-white">
            <strong>{$questionnaire.questions.length}</strong>
            {$t('course.navItem.lessons.exercises.all_exercises.view_mode.questions')}
          </p>
          |
          <p class="mx-2 dark:text-white">
            <strong>{getTotalPossibleGrade($questionnaire.questions)}</strong>
            {$t('course.navItem.lessons.exercises.all_exercises.view_mode.points')}.
          </p>
          |
          <p class="mx-2 dark:text-white">{$t('course.navItem.lessons.exercises.all_exercises.view_mode.all')}</p>
          {#if $questionnaire.dueBy}
            |
            <p class="mx-2 dark:text-white">
              <strong>{$t('course.navItem.lessons.exercises.all_exercises.view_mode.due')}:</strong>
              {new Date($questionnaire.dueBy).toLocaleString()}
            </p>
          {/if}
        </div>

        <article class="preview prose prose-sm sm:prose mt-3 p-2">
          {@html sanitizeHtml(
            $questionnaire.description || $t('course.navItem.lessons.exercises.all_exercises.view_mode.no_description')
          )}
        </article>

        <Button onclick={handleStart} type="button" class="float-right my-5">
          {$t('course.navItem.lessons.exercises.all_exercises.view_mode.start')}
        </Button>
      {/if}
    </div>
  </RoleBasedSecurity>
{:else if $questionnaireMetaData.isFinished}
  {#if !isLoadingAutoSavedData}
    <div class="flex items-center justify-between">
      <div class="flex w-full flex-col items-start lg:flex-row lg:items-center lg:space-x-4">
        {#if STATUS.GRADED === $questionnaireMetaData.status}
          <Badge variant="success" title={$t('course.navItem.lessons.exercises.all_exercises.view_mode.status_graded')}>
            {$t('course.navItem.lessons.exercises.all_exercises.view_mode.graded')}
          </Badge>
        {:else if courseApi.course?.type === 'SELF_PACED'}
          <Badge
            variant="success"
            title={$t('course.navItem.lessons.exercises.all_exercises.view_mode.status_submitted')}
          >
            {$t('course.navItem.lessons.exercises.all_exercises.view_mode.submitted')}
          </Badge>
        {:else}
          <Badge
            variant="warning"
            title={$t('course.navItem.lessons.exercises.all_exercises.view_mode.status_pending')}
          >
            {$t('course.navItem.lessons.exercises.all_exercises.view_mode.pending')}
          </Badge>
        {/if}
      </div>
      {#if STATUS.GRADED === $questionnaireMetaData.status && courseApi.course?.type !== 'SELF_PACED'}
        <Badge variant="outline" title={$t('course.navItem.lessons.exercises.all_exercises.view_mode.status_graded')}>
          {$questionnaireMetaData.finalTotalGrade}/{$questionnaireMetaData.totalPossibleGrade}
        </Badge>
      {/if}
    </div>

    {#if $questionnaireMetaData.status === STATUS.GRADED && $questionnaireMetaData.comment && courseApi.course?.type !== 'SELF_PACED'}
      <div class="bg-primary-700 mt-3 flex items-center justify-between rounded-sm p-4 text-white">
        <span> {$questionnaireMetaData.comment}</span>
      </div>
    {/if}
    <Preview
      questions={$questionnaire.questions.sort((a, b) => a.order - b.order)}
      questionnaireMetaData={$questionnaireMetaData}
      grades={$questionnaireMetaData.grades}
      disableGrading={true}
    />
  {/if}
{:else if currentQuestion && currentQuestion?.id}
  {#key currentQuestion.id}
    <!-- <div transition:fade id="question"> -->
    <div in:fly={{ x: 500, duration: 1000 }} id="question">
      {#if sharedQuestionModel}
        <ExerciseQuestion.QuestionRenderer
          contract={{
            mode: 'take',
            question: sharedQuestionModel,
            answer: sharedCurrentAnswer,
            labels: questionLabels,
            disabled: isSubmitting
          }}
          onAnswerChange={onSharedAnswerChange}
        />

        <div class="mt-4">
          <ExerciseQuestion.QuestionNavigation
            canGoBack={$questionnaireMetaData.currentQuestionIndex > 1}
            canGoNext={canGoNextForSharedQuestion && !isSubmitting}
            isLast={$questionnaireMetaData.currentQuestionIndex === $questionnaire.questions.length}
            previousLabel={t.get('course.navItem.lessons.exercises.all_exercises.previous')}
            nextLabel={t.get('course.navItem.lessons.exercises.all_exercises.next')}
            finishLabel={t.get('course.navItem.lessons.exercises.all_exercises.finish')}
            {onPrevious}
            onNext={onSharedNext}
          />
        </div>
      {/if}
    </div>
  {/key}
{/if}
