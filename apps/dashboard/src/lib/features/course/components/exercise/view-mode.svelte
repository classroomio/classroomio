<script lang="ts">
  import { get } from 'svelte/store';
  import { untrack } from 'svelte';
  import { fly } from 'svelte/transition';
  import { cubicInOut } from 'svelte/easing';
  import { courseApi } from '$features/course/api';
  import { questionnaire, questionnaireMetaData } from './store';
  import Preview from './preview.svelte';
  import { ExerciseQuestion } from '@cio/ui';
  import * as Alert from '@cio/ui/base/alert';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import { RoleBasedSecurity } from '$features/ui';
  import { Empty } from '@cio/ui/custom/empty';
  import FileQuestionIcon from '@lucide/svelte/icons/file-question';
  import { Progress } from '@cio/ui/base/progress';
  import { getExerciseQuestionContractKey } from '@cio/question-types';
  import { STATUS } from './constants';
  import { filterOutDeleted } from './functions';
  import { formatAnswers } from '$features/course/utils/functions';
  import { toApiPayload, type AnswerData } from '@cio/question-types';
  import { exerciseApi, presignApi } from '$features/course/api';
  import type { SubmissionListItem } from '$features/course/utils/types';
  import { sanitizeHtml } from '@cio/ui/tools/sanitize';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import { ContentType } from '@cio/utils/constants/content';
  import { toExerciseQuestionModel } from './question-type-utils';
  import { getExerciseQuestionLabels } from './question-labels';
  import axios from 'axios';

  interface Props {
    preview?: boolean;
    exerciseId?: string;
    isFetchingExercise?: boolean;
    /** Current user's submission from server (no client fetch) */
    mySubmission?: SubmissionListItem | null;
  }

  let { preview = false, exerciseId = '', isFetchingExercise = false, mySubmission = null }: Props = $props();

  let isSubmitting = $state(false);
  let isLoadingAutoSavedData = $state(false);
  let alreadyCheckedAutoSavedData = $state(false);
  let prevExerciseId = $state('');
  let slideDirection = $state<'next' | 'prev'>('next');
  const questionLabels = $derived(getExerciseQuestionLabels());

  function handleStart() {
    questionnaireMetaData.update((m) => ({ ...m, currentQuestionIndex: m.currentQuestionIndex + 1 }));
  }

  function normalizeAnswerValue(
    previousValue: AnswerData | undefined,
    nextValue: AnswerData | undefined
  ): AnswerData | undefined {
    if (nextValue && typeof nextValue === 'object' && 'type' in nextValue) {
      return nextValue;
    }
    return previousValue;
  }

  function mapAnswerToApiPayload(question, answerData: AnswerData | null | undefined) {
    const questionId = Number(question.id);
    if (Number.isNaN(questionId) || !answerData) return null;
    return toApiPayload(answerData, questionId);
  }

  async function onSubmit(id, value) {
    if (!courseApi.course?.id) return;

    const { answers } = $questionnaireMetaData;
    const { questions } = $questionnaire;
    const prevAnswer = answers[id];
    const formattedAnswer = normalizeAnswerValue(prevAnswer, value);

    if (!hasAnswerValue(formattedAnswer)) {
      snackbar.error(t.get('course.navItem.lessons.exercises.all_exercises.view_mode.answer_required'));
      return;
    }

    const question = questions.find((q) => getExerciseQuestionContractKey(toExerciseQuestionModel(q)) === id);
    if (question && !mapAnswerToApiPayload(question, formattedAnswer as AnswerData)) {
      snackbar.error(t.get('course.navItem.lessons.exercises.all_exercises.view_mode.answer_required'));
      return;
    }

    const newAnswers = { ...answers, [id]: formattedAnswer };
    questionnaireMetaData.update((m) => ({ ...m, answers: newAnswers }));

    const currentIndex = $questionnaireMetaData.currentQuestionIndex;
    const isLastQuestion = currentIndex === questions.length;

    if (isLastQuestion) {
      // Stay on last question, show spinner, submit to server
      if (isSubmitting) return;
      isSubmitting = true;

      const updated = get(questionnaireMetaData);
      localStorage.removeItem(`autosave-exercise-${exerciseId}`);
      const totalPossibleGrade = getTotalPossibleGrade($questionnaire.questions);

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
      }
      isSubmitting = false;
    } else {
      // Advance to next question
      slideDirection = 'next';
      questionnaireMetaData.update((m) => ({ ...m, currentQuestionIndex: m.currentQuestionIndex + 1 }));
      const updated = get(questionnaireMetaData);
      localStorage.setItem(`autosave-exercise-${exerciseId}`, JSON.stringify(updated));
    }
  }

  function onPrevious() {
    slideDirection = 'prev';
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

  async function handleFileUpload(file: File): Promise<{ fileKey: string; fileName: string; fileUrl?: string }> {
    const uploadResult = await presignApi.getDocumentUploadUrl(
      file.name,
      file.type as
        | 'application/pdf'
        | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        | 'application/msword'
    );
    if (!uploadResult) {
      throw new Error('Failed to get upload URL');
    }
    await axios.put(uploadResult.url, file, {
      headers: { 'Content-Type': file.type },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    const urls = await presignApi.getDocumentDownloadUrls([uploadResult.fileKey]);
    const fileUrl = urls[uploadResult.fileKey];

    return { fileKey: uploadResult.fileKey, fileName: file.name, fileUrl };
  }

  function hasAnswerValue(answerValue: AnswerData | null | undefined): boolean {
    if (answerValue === null || answerValue === undefined) return false;
    if (typeof answerValue === 'object' && 'type' in answerValue) {
      switch (answerValue.type) {
        case 'RADIO':
        case 'TRUE_FALSE':
        case 'NUMERIC':
          return true;
        case 'CHECKBOX':
          return answerValue.optionIds.length > 0;
        case 'TEXTAREA':
        case 'SHORT_ANSWER':
          return answerValue.text.trim().length > 0;
        case 'FILL_BLANK':
          return answerValue.values.length > 0;
        case 'FILE_UPLOAD':
          return !!answerValue.fileKey;
        case 'MATCHING':
          return answerValue.pairs.length > 0;
        case 'ORDERING':
          return answerValue.orderedValues.length > 0;
        case 'LINK':
          return answerValue.urls.length > 0;
        case 'HOTSPOT':
          return answerValue.coordinates.length > 0;
        default:
          return false;
      }
    }
    return false;
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

  function onSharedNext(valueOverride?: AnswerData) {
    if (!sharedCurrentQuestionKey) return;
    const valueToUse = valueOverride !== undefined ? valueOverride : sharedCurrentAnswer;
    if (!hasAnswerValue(valueToUse)) {
      snackbar.error(t.get('course.navItem.lessons.exercises.all_exercises.view_mode.answer_required'));
      return;
    }

    onSubmit(sharedCurrentQuestionKey, valueToUse);
  }

  function handleEnterKey(e: KeyboardEvent) {
    if (e.key !== 'Enter' || isSubmitting || !currentQuestion) return;

    const target = e.target as HTMLElement;
    if (target?.tagName === 'TEXTAREA') return;

    e.preventDefault();

    let valueToUse: AnswerData | undefined = sharedCurrentAnswer as AnswerData | undefined;

    if (target instanceof HTMLInputElement && sharedQuestionModel) {
      const questionTypeKey = sharedQuestionModel.questionType;
      const trimmed = target.value?.trim() ?? '';

      if (questionTypeKey === 'SHORT_ANSWER' && trimmed) {
        valueToUse = { type: 'SHORT_ANSWER', text: trimmed };
        onSharedAnswerChange(valueToUse);
      } else if (questionTypeKey === 'NUMERIC' && trimmed) {
        const num = Number(trimmed);
        valueToUse = !Number.isNaN(num) ? { type: 'NUMERIC', value: num } : undefined;

        if (valueToUse) onSharedAnswerChange(valueToUse);
      }
    }
    if (!hasAnswerValue(valueToUse)) {
      snackbar.error($t('course.navItem.lessons.exercises.all_exercises.view_mode.answer_required'));
      return;
    }
    onSharedNext(valueToUse);
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

  const flyX = $derived(slideDirection === 'next' ? 300 : -300);
  const flyOutX = $derived(-flyX);

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
    if (isFetchingExercise || !mySubmission || $questionnaireMetaData.isFinished) return;
    applyMySubmission(mySubmission);
  });

  function applyMySubmission(submission: SubmissionListItem) {
    const totalPossibleGrade = getTotalPossibleGrade($questionnaire.questions);
    let finalTotalGrade = 0;
    const grades = (submission.answers ?? []).reduce<Record<string, number>>((acc, answer) => {
      const point = answer.point ?? 0;
      acc[String(answer.questionId)] = point;
      finalTotalGrade += point;
      return acc;
    }, {});

    const answers = formatAnswers({
      questions: $questionnaire.questions,
      answers: submission.answers ?? []
    });

    questionnaireMetaData.update((m) => ({
      ...m,
      answers,
      totalPossibleGrade,
      currentQuestionIndex: $questionnaire.questions.length,
      isFinished: true,
      status: submission.statusId ?? STATUS.PENDING,
      finalTotalGrade,
      comment: submission.feedback ?? '',
      grades,
      exerciseId
    }));
  }

  $effect(() => {
    if (prevExerciseId === exerciseId) return;
    if (!!prevExerciseId) {
      isSubmitting = false;
      alreadyCheckedAutoSavedData = false;
    }
    prevExerciseId = exerciseId;
  });
</script>

{#if !preview && $questionnaire.questions.length && !$questionnaireMetaData.isFinished}
  <div class="mb-6">
    <Progress value={$questionnaireMetaData.progressValue} />
  </div>
{/if}

<svelte:window onkeydown={handleEnterKey} />

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
    </div>
  </RoleBasedSecurity>
{:else if $questionnaireMetaData.isFinished}
  {#if !isLoadingAutoSavedData}
    <div class="flex w-full flex-col items-start lg:flex-row lg:items-center lg:space-x-4">
      {#if STATUS.GRADED === $questionnaireMetaData.status}
        <div class="mb-8 w-full space-y-2">
          <Badge variant="success" title={$t('course.navItem.lessons.exercises.all_exercises.view_mode.status_graded')}>
            {$t('course.navItem.lessons.exercises.all_exercises.view_mode.graded')}
          </Badge>

          <div class="flex w-full flex-col items-start gap-2 md:flex-row md:items-center">
            {#if $questionnaireMetaData.comment}
              <Alert.Callout
                variant="information"
                title={$t('course.navItem.lessons.exercises.all_exercises.view_mode.instructor_feedback')}
                description={$questionnaireMetaData.comment}
                class="h-fit! w-full! flex-1!"
              />
            {/if}
            <div class="flex flex-col justify-between gap-2 rounded-md border p-4">
              <p>
                <span class="text-2xl font-bold">{$questionnaireMetaData.finalTotalGrade}/</span>

                <span class="text-xl">{$questionnaireMetaData.totalPossibleGrade}</span>
              </p>
            </div>
          </div>
        </div>
      {:else if courseApi.course?.type === 'SELF_PACED'}
        <Badge
          variant="success"
          title={$t('course.navItem.lessons.exercises.all_exercises.view_mode.status_submitted')}
        >
          {$t('course.navItem.lessons.exercises.all_exercises.view_mode.submitted')}
        </Badge>
      {:else}
        <Badge variant="warning" title={$t('course.navItem.lessons.exercises.all_exercises.view_mode.status_pending')}>
          {$t('course.navItem.lessons.exercises.all_exercises.view_mode.pending')}
        </Badge>
      {/if}
    </div>

    <Preview
      questions={$questionnaire.questions.sort((a, b) => a.order - b.order)}
      questionnaireMetaData={$questionnaireMetaData}
      grades={$questionnaireMetaData.grades}
      disableGrading={true}
    />
  {/if}
{:else if currentQuestion && currentQuestion?.id}
  <div class="flex flex-col gap-4">
    <div class="grid overflow-hidden" style="grid-template-areas: 'slot';">
      {#key currentQuestion.id}
        <div
          id="question"
          class="min-w-0 [grid-area:slot]"
          in:fly={{ x: flyX, duration: 350, easing: cubicInOut }}
          out:fly={{ x: flyOutX, duration: 350, easing: cubicInOut }}
        >
          {#if sharedQuestionModel}
            <ExerciseQuestion.QuestionRenderer
              contract={{
                mode: 'take',
                question: sharedQuestionModel,
                answer: sharedCurrentAnswer,
                labels: questionLabels,
                disabled: isSubmitting,
                onFileUpload: handleFileUpload
              }}
              onAnswerChange={onSharedAnswerChange}
            />
          {/if}
        </div>
      {/key}
    </div>
    <div>
      <ExerciseQuestion.QuestionNavigation
        canGoBack={$questionnaireMetaData.currentQuestionIndex > 1}
        canGoNext={canGoNextForSharedQuestion && !isSubmitting}
        isLast={$questionnaireMetaData.currentQuestionIndex === $questionnaire.questions.length}
        {isSubmitting}
        previousLabel={t.get('course.navItem.lessons.exercises.all_exercises.previous')}
        nextLabel={t.get('course.navItem.lessons.exercises.all_exercises.next')}
        finishLabel={t.get('course.navItem.lessons.exercises.all_exercises.finish')}
        {onPrevious}
        onNext={onSharedNext}
      />
    </div>
  </div>
{/if}
