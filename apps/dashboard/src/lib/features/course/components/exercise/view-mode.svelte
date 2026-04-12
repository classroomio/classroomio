<script lang="ts">
  import { get } from 'svelte/store';
  import { untrack } from 'svelte';
  import { fly } from 'svelte/transition';
  import { cubicInOut } from 'svelte/easing';
  import { courseApi } from '$features/course/api';
  import { questionnaire, questionnaireMetaData, resetStudentExerciseTake } from './store';
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
  import {
    getTextareaAnswerCharacterCount,
    toApiPayload,
    type AnswerData,
    validateTextareaAnswer
  } from '@cio/question-types';
  import { exerciseApi, presignApi } from '$features/course/api';
  import type { SubmissionListItem } from '$features/course/utils/types';
  import { SafeHtmlContent } from '@cio/ui/custom/safe-html-content';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import { ContentType } from '@cio/utils/constants/content';
  import { getOrderedNavigableContent } from '$features/course/utils/content';
  import { isOrgStudent } from '$lib/utils/store/app';
  import { openCourseCompletionModal } from '$features/course/store/course-completion-modal';
  import { isSelfPacedLikeCourse } from '$features/course/utils/compliance-utils';
  import { toExerciseQuestionModel } from './question-type-utils';
  import { getExerciseQuestionLabels } from './question-labels';
  import axios from 'axios';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

  interface Props {
    preview?: boolean;
    exerciseId?: string;
    isFetchingExercise?: boolean;
    /** Current user's submissions (ordered by attempt) */
    mySubmissions?: SubmissionListItem[];
  }

  let { preview = false, exerciseId = '', isFetchingExercise = false, mySubmissions = [] }: Props = $props();

  let isSubmitting = $state(false);
  /** When true, do not re-apply a past submission over a fresh take (Try again). */
  let skipHydrateFromSubmissions = $state(false);
  let isLoadingAutoSavedData = $state(false);
  let alreadyCheckedAutoSavedData = $state(false);
  let prevExerciseId = $state('');
  let slideDirection = $state<'next' | 'prev'>('next');
  let selectedTryIndex = $state(-1);
  const questionLabels = $derived(getExerciseQuestionLabels());

  const submissionList = $derived(Array.isArray(mySubmissions) ? mySubmissions : []);

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

      const submitResult = await exerciseApi.submit(courseApi.course.id, exerciseId, answersForApi);

      if (exerciseApi.success && submitResult?.data) {
        skipHydrateFromSubmissions = false;
        const sub = submitResult.data as unknown as SubmissionListItem & { gradingState?: string };
        if (sub.gradingState === 'completed' && sub.statusId === STATUS.GRADED && Array.isArray(sub.answers)) {
          applyMySubmission(sub);
        } else {
          questionnaireMetaData.update((m) => ({
            ...m,
            status: 1,
            totalPossibleGrade,
            grades: {},
            comment: '',
            isFinished: true,
            exerciseId
          }));
        }
        courseApi.updateContentItem(exerciseId, ContentType.Exercise, { isComplete: true });

        const allContentItems = getOrderedNavigableContent(courseApi.course);
        const allComplete =
          $isOrgStudent && allContentItems.length > 0 && allContentItems.every((item) => item.isComplete);

        if (allComplete && courseApi.course?.id) {
          openCourseCompletionModal(courseApi.course.id);
        }
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
        case 'STAR':
          return true;
        case 'CHECKBOX':
          return answerValue.optionIds.length > 0;
        case 'TEXTAREA':
          return getTextareaAnswerCharacterCount(answerValue.text) > 0;
        case 'SHORT_ANSWER':
          return answerValue.text.trim().length > 0;
        case 'FILL_BLANK':
          return answerValue.values.length > 0;
        case 'WORD_BANK': {
          const filled = answerValue.filledBlanks ?? [];
          return filled.length > 0 && filled.every((v) => String(v).trim().length > 0);
        }
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

    const textareaError = getTextareaValidationError(valueToUse);
    if (textareaError) {
      snackbar.error(textareaError);
      return;
    }

    onSubmit(sharedCurrentQuestionKey, valueToUse);
  }

  function handleEnterKey(e: KeyboardEvent) {
    if (e.key !== 'Enter' || isSubmitting || !currentQuestion) return;

    const target = e.target as HTMLElement;
    if (target?.tagName === 'TEXTAREA' || isTextEditorTarget(target)) return;

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

  function isTextEditorTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;

    if (target.isContentEditable) return true;

    return target.closest('[contenteditable="true"], .ProseMirror') !== null;
  }

  function getTextareaValidationError(answerValue: AnswerData | null | undefined): string | null {
    if (!sharedQuestionModel || !answerValue || answerValue.type !== 'TEXTAREA') return null;

    const validation = validateTextareaAnswer(answerValue.text, sharedQuestionModel);
    if (validation.isValid) return null;

    if (validation.minCharacters !== undefined && validation.maxCharacters !== undefined) {
      return t.get('course.navItem.lessons.exercises.all_exercises.shared_question.textarea.take.range_error', {
        min: validation.minCharacters,
        max: validation.maxCharacters
      });
    }

    if (validation.reason === 'below_min' && validation.minCharacters !== undefined) {
      return t.get('course.navItem.lessons.exercises.all_exercises.shared_question.textarea.take.min_error', {
        min: validation.minCharacters
      });
    }

    if (validation.reason === 'above_max' && validation.maxCharacters !== undefined) {
      return t.get('course.navItem.lessons.exercises.all_exercises.shared_question.textarea.take.max_error', {
        max: validation.maxCharacters
      });
    }

    return null;
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
    if (!exerciseId || isFetchingExercise || skipHydrateFromSubmissions) return;
    if (!submissionList.length || $questionnaireMetaData.isFinished) return;
    let idx = selectedTryIndex;
    if (idx < 0 || idx >= submissionList.length) {
      idx = submissionList.length - 1;
      selectedTryIndex = idx;
    }
    const sub = submissionList[idx];
    if (sub) applyMySubmission(sub);
  });

  function goPrevTry() {
    if (selectedTryIndex <= 0) return;
    selectedTryIndex -= 1;
    const sub = submissionList[selectedTryIndex];
    if (sub) applyMySubmission(sub);
  }

  function goNextTry() {
    if (selectedTryIndex >= submissionList.length - 1) return;
    selectedTryIndex += 1;
    const sub = submissionList[selectedTryIndex];
    if (sub) applyMySubmission(sub);
  }

  function tryAgain() {
    if (!$questionnaire.allowMultipleAttempts) return;
    localStorage.removeItem(`autosave-exercise-${exerciseId}`);
    selectedTryIndex = -1;
    skipHydrateFromSubmissions = true;
    resetStudentExerciseTake();
  }

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
      skipHydrateFromSubmissions = false;
      selectedTryIndex = -1;
    }
    prevExerciseId = exerciseId;
  });
</script>

{#if !preview && $questionnaire.questions.length && !$questionnaireMetaData.isFinished && $questionnaireMetaData.currentQuestionIndex > 0}
  <div class="mb-6 flex min-w-0 items-center gap-3">
    <span class="ui:text-muted-foreground shrink-0 text-sm tabular-nums">
      {$questionnaireMetaData.currentQuestionIndex}/{$questionnaire.questions.length}
    </span>
    <Progress class="min-w-0 flex-1" value={$questionnaireMetaData.progressValue} />
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
        <SafeHtmlContent
          content={$questionnaire.description ||
            $t('course.navItem.lessons.exercises.all_exercises.view_mode.no_description')}
        />
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
      {:else if isSelfPacedLikeCourse(courseApi.course?.type)}
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

    {#if submissionList.length > 1}
      <div class="mb-4 flex flex-wrap items-center gap-2">
        <IconButton
          disabled={selectedTryIndex <= 0}
          onclick={goPrevTry}
          tooltip={$t('course.navItem.lessons.exercises.all_exercises.view_mode.previous_try')}
        >
          <ChevronLeftIcon class="h-4 w-4" />
        </IconButton>
        <span class="ui:text-muted-foreground text-sm">
          {$t('course.navItem.lessons.exercises.all_exercises.view_mode.attempt_counter', {
            current: selectedTryIndex + 1,
            total: submissionList.length
          })}
        </span>
        <IconButton
          disabled={selectedTryIndex >= submissionList.length - 1}
          onclick={goNextTry}
          tooltip={$t('course.navItem.lessons.exercises.all_exercises.view_mode.next_try')}
        >
          <ChevronRightIcon class="h-4 w-4" />
        </IconButton>
      </div>
    {/if}

    <Preview
      questions={[...$questionnaire.questions].sort(
        (leftQuestion, rightQuestion) => leftQuestion.order - rightQuestion.order
      )}
      questionnaireMetaData={$questionnaireMetaData}
      grades={$questionnaireMetaData.grades}
      disableGrading={true}
    />

    <RoleBasedSecurity allowedRoles={[3]}>
      {#if $questionnaire.allowMultipleAttempts}
        <div class="mt-4">
          <Button type="button" variant="secondary" onclick={tryAgain}>
            {$t('course.navItem.lessons.exercises.all_exercises.view_mode.try_again')}
          </Button>
        </div>
      {/if}
    </RoleBasedSecurity>
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
