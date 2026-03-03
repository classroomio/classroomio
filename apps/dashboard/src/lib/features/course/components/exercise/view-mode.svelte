<script lang="ts">
  import { get } from 'svelte/store';
  import { untrack } from 'svelte';
  import { fly } from 'svelte/transition';
  import { cubicInOut } from 'svelte/easing';
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
  import { filterOutDeleted } from './functions';
  import { enrichFileUploadAnswersWithUrls, formatAnswers, getGroupMemberId } from '$features/course/utils/functions';
  import { exerciseApi, presignApi, submissionApi } from '$features/course/api';
  import { profile } from '$lib/utils/store/user';
  import { sanitizeHtml } from '@cio/ui/tools/sanitize';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import { ContentType } from '@cio/utils/constants/content';
  import { getQuestionTypeKey, questionTypeSupportsOptions, toExerciseQuestionModel } from './question-type-utils';
  import { getExerciseQuestionLabels } from './question-labels';
  import axios from 'axios';

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
  let slideDirection = $state<'next' | 'prev'>('next');
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
      const obj = answerValue as Record<string, unknown>;
      if ('fileKey' in obj && typeof obj.fileKey === 'string') {
        const { fileUrl: _fileUrl, ...rest } = obj;
        return { questionId, answer: JSON.stringify(rest) };
      }
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

    if (!hasAnswerValue(formattedAnswer)) {
      snackbar.error(t.get('course.navItem.lessons.exercises.all_exercises.view_mode.answer_required'));
      return;
    }

    const question = questions.find((q) => getExerciseQuestionContractKey(toExerciseQuestionModel(q)) === id);
    if (question && !mapAnswerToApiPayload(question, formattedAnswer)) {
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
          (acc: Record<string, number>, answer: { questionId: number; point: number }) => {
            acc[String(answer.questionId)] = answer.point;
            finalTotalGrade += answer.point;
            return acc;
          },
          {}
        );

        const baseAnswers = formatAnswers({
          questions: $questionnaire.questions,
          answers: submission.answers
        });
        const answers = await enrichFileUploadAnswersWithUrls(baseAnswers as Record<string, unknown>);

        questionnaireMetaData.update((m) => ({
          ...m,
          answers,
          totalPossibleGrade,
          currentQuestionIndex: $questionnaire.questions.length,
          isFinished: true,
          status: submission.statusId,
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

  function hasAnswerValue(answerValue) {
    if (answerValue === null || answerValue === undefined) return false;
    if (typeof answerValue === 'string') return answerValue.trim().length > 0;
    if (Array.isArray(answerValue)) return answerValue.length > 0;
    if (typeof answerValue === 'object' && !Array.isArray(answerValue)) {
      return Object.keys(answerValue).length > 0;
    }
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

  function onSharedNext(valueOverride?: unknown) {
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
    let valueToUse: unknown = sharedCurrentAnswer;
    if (target instanceof HTMLInputElement && target.value?.trim()) {
      valueToUse = target.value.trim();
      onSharedAnswerChange(valueToUse);
    }
    if (!hasAnswerValue(valueToUse)) {
      snackbar.error(t.get('course.navItem.lessons.exercises.all_exercises.view_mode.answer_required'));
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
    <div class="mb-4 flex items-center justify-between">
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
      <div class="bg-primary-700 my-2 flex items-center justify-between rounded-sm p-4 text-white">
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
