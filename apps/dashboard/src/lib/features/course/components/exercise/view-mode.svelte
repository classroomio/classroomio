<script lang="ts">
  import { get } from 'svelte/store';
  import { untrack } from 'svelte';
  import { fly } from 'svelte/transition';
  import { cubicInOut } from 'svelte/easing';
  import { courseApi } from '$features/course/api';
  import {
    getQuestionsForSection,
    hasSections,
    questionnaire,
    questionnaireMetaData,
    resetStudentExerciseTake
  } from './store';
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
    type ExerciseQuestionVideoRecordingUploader,
    validateTextareaAnswer
  } from '@cio/question-types';
  import { exerciseApi, presignApi } from '$features/course/api';
  import type { SubmissionListItem } from '$features/course/utils/types';
  import { SafeHtmlContent } from '@cio/ui/custom/safe-html-content';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import { toggleConfetti } from '$features/ui/confetti/store';
  import { ContentType } from '@cio/utils/constants/content';
  import { getOrderedNavigableContent } from '$features/course/utils/content';
  import { isOrgStudent } from '$lib/utils/store/app';
  import {
    openCourseCompletionModal,
    updateCourseCompletionModal,
    closeCourseCompletionModal
  } from '$features/course/store/course-completion-modal';
  import { isSelfPacedLikeCourse } from '$features/course/utils/compliance-utils';
  import { toExerciseQuestionModel } from './question-type-utils';
  import { getExerciseQuestionLabels } from './question-labels';
  import { getExerciseSectionDisplayTitle } from '$features/course/utils/exercise-section-utils';
  import { shouldCompleteExerciseFromSubmission } from '$features/course/utils/exercise-progression-utils';
  import axios from 'axios';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import type { Question } from '$features/course/types';
  import { getResolvedUploadLimits } from '$lib/utils/config/upload-limits-context';

  interface Props {
    preview?: boolean;
    exerciseId?: string;
    isFetchingExercise?: boolean;
    /** Current user's submissions (ordered by attempt) */
    mySubmissions?: SubmissionListItem[];
  }

  let { preview = false, exerciseId = '', isFetchingExercise = false, mySubmissions = [] }: Props = $props();

  const uploadLimits = getResolvedUploadLimits();
  const platformMaxFileSizeMb = uploadLimits.exerciseFileMb;

  let isSubmitting = $state(false);
  /** When true, do not re-apply a past submission over a fresh take (Try again). */
  let skipHydrateFromSubmissions = $state(false);
  let isLoadingAutoSavedData = $state(false);
  let alreadyCheckedAutoSavedData = $state(false);
  let prevExerciseId = $state('');
  let slideDirection = $state<'next' | 'prev'>('next');
  let selectedTryIndex = $state(-1);
  const questionLabels = $derived(getExerciseQuestionLabels());
  const sectionFallbackTitle = $derived($t('course.navItem.lessons.exercises.all_exercises.section.fallback_title'));

  /** Submissions created in this session — the `mySubmissions` prop only refreshes on page load. */
  let localSubmissions = $state<SubmissionListItem[]>([]);

  const submissionList = $derived.by(() => {
    const loadedSubmissions = Array.isArray(mySubmissions) ? mySubmissions : [];
    const newSubmissions = localSubmissions.filter(
      (localSubmission) => !loadedSubmissions.some((loadedSubmission) => loadedSubmission.id === localSubmission.id)
    );
    return [...loadedSubmissions, ...newSubmissions];
  });

  /** Attempt currently shown: -1 means "latest" (e.g. right after submitting). */
  const viewedAttemptIndex = $derived(selectedTryIndex >= 0 ? selectedTryIndex : submissionList.length - 1);

  function handleStart() {
    questionnaireMetaData.update((m) => ({
      ...m,
      currentQuestionIndex: 1,
      currentSectionIndex: 0,
      sectionPhase: hasSectionedExercise ? 'overview' : 'questions'
    }));
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

  async function submitExercise() {
    if (!courseApi.course?.id || isSubmitting) return;

    isSubmitting = true;

    const updated = get(questionnaireMetaData);
    localStorage.removeItem(`autosave-exercise-${exerciseId}`);
    const totalPossibleGrade = getTotalPossibleGrade($questionnaire.questions);

    const answersForApi = Object.entries(updated.answers)
      .map(([questionKey, val]) => {
        const question = $questionnaire.questions.find(
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
      localSubmissions = [...localSubmissions, sub];
      selectedTryIndex = submissionList.length - 1;
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
      const shouldMarkComplete = shouldCompleteExerciseFromSubmission({
        completionPolicy: $questionnaire.completionPolicy,
        passThreshold: $questionnaire.passThreshold,
        totalPossiblePoints: totalPossibleGrade,
        submission: sub
      });

      courseApi.updateContentItem(exerciseId, ContentType.Exercise, { isComplete: shouldMarkComplete });

      if (shouldMarkComplete) {
        toggleConfetti();
        setTimeout(toggleConfetti, 3000);
      }

      const allContentItems = getOrderedNavigableContent(courseApi.course);
      const allComplete =
        shouldMarkComplete &&
        $isOrgStudent &&
        allContentItems.length > 0 &&
        allContentItems.every((item) => item.isComplete);

      if (allComplete && courseApi.course?.id) {
        const requiredExerciseId = courseApi.course?.certificate?.requiredExerciseId ?? undefined;
        openCourseCompletionModal(courseApi.course.id);

        const certRes = await courseApi.getCertificationEvaluation(courseApi.course.id);
        if (certRes?.data) {
          const hasCompletedCourse = Boolean(certRes.data.eligibleForCertificate || certRes.data.certificateEarnedAt);
          updateCourseCompletionModal(
            courseApi.course.id,
            hasCompletedCourse ? 'eligible' : 'not-eligible',
            certRes.data,
            requiredExerciseId
          );
        } else {
          closeCourseCompletionModal();
        }
      }
    }

    isSubmitting = false;
  }

  function evaluateSectionAfterBehavior() {
    if (!currentSection) return;

    const behavior = currentSection.afterBehavior;
    if (behavior.action === 'submit') {
      submitExercise();
      return;
    }

    if (behavior.action === 'go_to_section' && behavior.exerciseSectionId) {
      const targetIndex = activeSections.findIndex((section) => section.id === behavior.exerciseSectionId);
      if (targetIndex >= 0) {
        questionnaireMetaData.update((m) => ({
          ...m,
          currentSectionIndex: targetIndex,
          currentQuestionIndex: 1,
          sectionPhase: 'overview'
        }));
        return;
      }
    }

    const nextSectionIndex = $questionnaireMetaData.currentSectionIndex + 1;
    if (nextSectionIndex < activeSections.length) {
      questionnaireMetaData.update((m) => ({
        ...m,
        currentSectionIndex: nextSectionIndex,
        currentQuestionIndex: 1,
        sectionPhase: 'overview'
      }));
      return;
    }

    submitExercise();
  }

  async function onSubmit(id, value) {
    if (!courseApi.course?.id) return;

    const { answers } = $questionnaireMetaData;
    const questions = hasSectionedExercise ? currentSectionQuestions : $questionnaire.questions;
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
      if (hasSectionedExercise) {
        evaluateSectionAfterBehavior();
      } else {
        await submitExercise();
      }
    } else {
      // Advance to next question
      slideDirection = 'next';
      questionnaireMetaData.update((m) => ({ ...m, currentQuestionIndex: m.currentQuestionIndex + 1 }));
      const updated = get(questionnaireMetaData);
      localStorage.setItem(`autosave-exercise-${exerciseId}`, JSON.stringify(updated));
    }
  }

  function onPrevious() {
    if (hasSectionedExercise && $questionnaireMetaData.currentQuestionIndex <= 1) {
      questionnaireMetaData.update((m) => ({ ...m, sectionPhase: 'overview' }));
      return;
    }

    slideDirection = 'prev';
    questionnaireMetaData.update((m) => ({ ...m, currentQuestionIndex: m.currentQuestionIndex - 1 }));
  }

  function getProgressValue(currentQuestionIndex) {
    if ($questionnaireMetaData.isFinished) {
      return 100;
    }

    if (hasSectionedExercise) {
      const activeQuestionCount = $questionnaire.questions.filter((question) => !question.deletedAt).length;
      const answeredCount = Object.values($questionnaireMetaData.answers).filter((answer) =>
        hasAnswerValue(answer)
      ).length;
      return Math.round((answeredCount / activeQuestionCount) * 100) || 0;
    }

    return Math.round(((currentQuestionIndex - 1) / $questionnaire.questions.length) * 100) || 0;
  }

  function getTotalPossibleGrade(questions) {
    return questions.reduce((acc, question) => {
      acc += parseFloat(question.points);
      return acc;
    }, 0);
  }

  function formatPercent(value: number) {
    return new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 1
    }).format(value);
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
        | 'application/msword',
      file.size > 0 ? file.size : undefined
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

  const handleVideoRecordingUpload: ExerciseQuestionVideoRecordingUploader = async (input) => {
    if (!courseApi.course?.id || !exerciseId) {
      throw new Error('Exercise is not ready for upload');
    }

    const initResult = await exerciseApi.initVideoRecordingUpload(courseApi.course.id, exerciseId, input.questionId, {
      fileName: input.fileName,
      mimeType: input.mimeType as 'video/webm' | 'video/mp4' | 'video/quicktime',
      size: input.size
    });
    if (!initResult?.data) {
      throw new Error('Failed to get upload URL');
    }

    await axios.put(initResult.data.uploadUrl, input.blob, {
      headers: { 'Content-Type': input.mimeType },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    const completeResult = await exerciseApi.completeVideoRecordingUpload(
      courseApi.course.id,
      exerciseId,
      input.questionId,
      {
        assetId: initResult.data.assetId,
        storageKey: initResult.data.storageKey,
        fileName: input.fileName,
        mimeType: input.mimeType as 'video/webm' | 'video/mp4' | 'video/quicktime',
        size: input.size,
        durationSeconds: input.durationSeconds,
        recordedAt: input.recordedAt,
        retakeCount: input.retakeCount
      }
    );
    if (!completeResult?.data) {
      throw new Error('Failed to complete upload');
    }

    return completeResult.data;
  };

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
        case 'VIDEO_RECORDING':
          return !!answerValue.assetId && !!answerValue.storageKey;
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

  function onSharedAnswerChange(answerValue: AnswerData | null) {
    if (!sharedCurrentQuestionKey) return;

    questionnaireMetaData.update((metaData) => {
      const answers = { ...metaData.answers };
      if (answerValue === null) {
        delete answers[sharedCurrentQuestionKey];
      } else {
        answers[sharedCurrentQuestionKey] = answerValue;
      }

      return {
        ...metaData,
        answers
      };
    });
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

  function beginCurrentSection() {
    questionnaireMetaData.update((m) => ({
      ...m,
      currentQuestionIndex: 1,
      sectionPhase: 'questions'
    }));
  }

  function goBackFromSectionOverview() {
    if ($questionnaireMetaData.currentSectionIndex <= 0) {
      questionnaireMetaData.update((m) => ({
        ...m,
        currentQuestionIndex: 0,
        sectionPhase: 'overview'
      }));
      return;
    }

    questionnaireMetaData.update((m) => ({
      ...m,
      currentSectionIndex: m.currentSectionIndex - 1,
      currentQuestionIndex: 1,
      sectionPhase: 'overview'
    }));
  }

  function onSectionQuestionAnswerChange(question: Question, answerValue: AnswerData) {
    const questionKey = getExerciseQuestionContractKey(toExerciseQuestionModel(question));
    questionnaireMetaData.update((metaData) => ({
      ...metaData,
      answers: {
        ...metaData.answers,
        [questionKey]: answerValue
      }
    }));
  }

  function completeAllQuestionsSection() {
    const missingAnswer = currentSectionQuestions.find((question) => {
      const questionKey = getExerciseQuestionContractKey(toExerciseQuestionModel(question));
      return !hasAnswerValue($questionnaireMetaData.answers[questionKey]);
    });

    if (missingAnswer) {
      snackbar.error(t.get('course.navItem.lessons.exercises.all_exercises.view_mode.answer_required'));
      return;
    }

    evaluateSectionAfterBehavior();
  }

  function handleEnterKey(e: KeyboardEvent) {
    if (hasSectionedExercise && $questionnaire.sectionDisplayMode === 'all_questions') return;
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
  const activeSections = $derived(
    [...($questionnaire.sections ?? [])].filter((section) => !section.deletedAt).sort((a, b) => a.order - b.order)
  );
  const hasSectionedExercise = $derived(hasSections($questionnaire.sections ?? []));
  const currentSection = $derived(
    hasSectionedExercise ? activeSections[$questionnaireMetaData.currentSectionIndex] : null
  );
  const currentSectionQuestions = $derived(
    currentSection ? getQuestionsForSection($questionnaire.questions, currentSection.id) : []
  );
  const currentSectionDisplayTitle = $derived(
    currentSection
      ? getExerciseSectionDisplayTitle({
          title: currentSection.title,
          sectionNumber: $questionnaireMetaData.currentSectionIndex + 1,
          sectionLabel: sectionFallbackTitle
        })
      : ''
  );
  const currentQuestionList = $derived(hasSectionedExercise ? currentSectionQuestions : $questionnaire.questions);
  const currentQuestion = $derived(currentQuestionList[$questionnaireMetaData.currentQuestionIndex - 1]);
  const isExerciseLoaded = $derived(alreadyCheckedAutoSavedData && $questionnaire.questions.length > 0);
  const isFinished = $derived(
    isExerciseLoaded &&
      $questionnaireMetaData.currentQuestionIndex > 0 &&
      !currentQuestion &&
      (!hasSectionedExercise || $questionnaireMetaData.isFinished)
  );
  const sharedQuestionModel = $derived(currentQuestion ? toExerciseQuestionModel(currentQuestion) : null);
  const sharedCurrentQuestionKey = $derived(
    sharedQuestionModel ? getExerciseQuestionContractKey(sharedQuestionModel) : null
  );
  const sharedCurrentAnswer = $derived(
    sharedCurrentQuestionKey ? $questionnaireMetaData.answers[sharedCurrentQuestionKey] : undefined
  );
  const canGoNextForSharedQuestion = $derived(hasAnswerValue(sharedCurrentAnswer));
  const sectionQuestionTotalPoints = $derived(getTotalPossibleGrade(currentSectionQuestions));
  const passThresholdPercent = $derived(Number($questionnaire.passThreshold ?? 100));
  const gradedScorePercent = $derived.by(() => {
    const finalGrade = Number($questionnaireMetaData.finalTotalGrade);
    const totalGrade = Number($questionnaireMetaData.totalPossibleGrade);
    if (!Number.isFinite(finalGrade) || !Number.isFinite(totalGrade) || totalGrade <= 0) return null;

    return (finalGrade / totalGrade) * 100;
  });
  const shouldShowPassedCompletionResult = $derived(
    ($questionnaire.completionPolicy ?? 'submitted') === 'passed' &&
      STATUS.GRADED === $questionnaireMetaData.status &&
      gradedScorePercent !== null
  );
  const didCurrentAttemptPass = $derived(
    shouldShowPassedCompletionResult && gradedScorePercent !== null && gradedScorePercent >= passThresholdPercent
  );
  const gradedScorePercentLabel = $derived(gradedScorePercent === null ? '' : formatPercent(gradedScorePercent));
  const passThresholdPercentLabel = $derived(formatPercent(passThresholdPercent));
  const sectionNavigationGroups = $derived(
    activeSections.map((section, sectionIndex) => {
      const sectionQuestions = getQuestionsForSection($questionnaire.questions, section.id);
      return {
        id: section.id,
        title: getExerciseSectionDisplayTitle({
          title: section.title,
          sectionNumber: sectionIndex + 1,
          sectionLabel: sectionFallbackTitle
        }),
        isCurrent: currentSection?.id === section.id,
        questions: sectionQuestions.map((question, questionIndex) => {
          const questionKey = getExerciseQuestionContractKey(toExerciseQuestionModel(question));
          return {
            key: questionKey,
            label: `Q${questionIndex + 1}`,
            isAnswered: hasAnswerValue($questionnaireMetaData.answers[questionKey]),
            isCurrent:
              sectionIndex === $questionnaireMetaData.currentSectionIndex &&
              questionIndex === $questionnaireMetaData.currentQuestionIndex - 1 &&
              $questionnaireMetaData.sectionPhase === 'questions'
          };
        })
      };
    })
  );

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
    if (!isExerciseLoaded) return;
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
    if (viewedAttemptIndex <= 0) return;
    selectedTryIndex = viewedAttemptIndex - 1;
    const sub = submissionList[selectedTryIndex];
    if (sub) applyMySubmission(sub);
  }

  function goNextTry() {
    if (viewedAttemptIndex >= submissionList.length - 1) return;
    selectedTryIndex = viewedAttemptIndex + 1;
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
      currentQuestionIndex: $questionnaire.questions.length + 1,
      currentSectionIndex: activeSections.length > 0 ? activeSections.length - 1 : 0,
      sectionPhase: 'questions',
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
    if (prevExerciseId) {
      isSubmitting = false;
      alreadyCheckedAutoSavedData = false;
      skipHydrateFromSubmissions = false;
      selectedTryIndex = -1;
      localSubmissions = [];
    }
    prevExerciseId = exerciseId;
  });
</script>

{#if !preview && $questionnaire.questions.length && !$questionnaireMetaData.isFinished && $questionnaireMetaData.currentQuestionIndex > 0}
  <div class="mb-6 flex min-w-0 items-center gap-3">
    <span class="ui:text-muted-foreground shrink-0 text-sm tabular-nums">
      {#if hasSectionedExercise}
        {Object.values($questionnaireMetaData.answers).filter((answer) => hasAnswerValue(answer))
          .length}/{$questionnaire.questions.length}
      {:else}
        {$questionnaireMetaData.currentQuestionIndex}/{$questionnaire.questions.length}
      {/if}
    </span>
    <Progress class="min-w-0 flex-1" value={$questionnaireMetaData.progressValue} />
  </div>
{/if}

<svelte:window onkeydown={handleEnterKey} />

{#if preview}
  <RoleBasedSecurity allowedRoles={[1, 2]}>
    <Preview
      questions={filterOutDeleted($questionnaire.questions)}
      sections={$questionnaire.sections}
      questionnaireMetaData={$questionnaireMetaData}
    />
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
        {#if hasSectionedExercise}
          <p class="mx-2 dark:text-white">
            <strong>{activeSections.length}</strong>
            {$t('course.navItem.lessons.exercises.all_exercises.view_mode.sections')}
          </p>
          |
        {/if}
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
            {#if shouldShowPassedCompletionResult}
              <Alert.Root variant={didCurrentAttemptPass ? 'information' : 'warning'} class="h-fit! w-full! flex-1!">
                <div class="col-start-2 flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div class="min-w-0 space-y-1">
                    <p class="font-medium">
                      {didCurrentAttemptPass
                        ? $t('course.navItem.lessons.exercises.all_exercises.view_mode.passed_completion_result_title')
                        : $t(
                            'course.navItem.lessons.exercises.all_exercises.view_mode.not_passed_completion_result_title'
                          )}
                    </p>
                    <p class="ui:text-muted-foreground text-sm">
                      {didCurrentAttemptPass
                        ? $t(
                            'course.navItem.lessons.exercises.all_exercises.view_mode.passed_completion_result_description',
                            {
                              scorePercent: gradedScorePercentLabel,
                              requiredPercent: passThresholdPercentLabel
                            }
                          )
                        : $t(
                            'course.navItem.lessons.exercises.all_exercises.view_mode.not_passed_completion_result_description',
                            {
                              scorePercent: gradedScorePercentLabel,
                              requiredPercent: passThresholdPercentLabel
                            }
                          )}
                    </p>
                  </div>
                  {#if $questionnaire.allowMultipleAttempts && !didCurrentAttemptPass}
                    <Button type="button" variant="outline" onclick={tryAgain} class="shrink-0">
                      {$t('course.navItem.lessons.exercises.all_exercises.view_mode.try_again')}
                    </Button>
                  {/if}
                </div>
              </Alert.Root>
            {/if}
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
          disabled={viewedAttemptIndex <= 0}
          onclick={goPrevTry}
          tooltip={$t('course.navItem.lessons.exercises.all_exercises.view_mode.previous_try')}
        >
          <ChevronLeftIcon class="h-4 w-4" />
        </IconButton>
        <span class="ui:text-muted-foreground text-sm">
          {$t('course.navItem.lessons.exercises.all_exercises.view_mode.attempt_counter', {
            current: viewedAttemptIndex + 1,
            total: submissionList.length
          })}
        </span>
        <IconButton
          disabled={viewedAttemptIndex >= submissionList.length - 1}
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
      sections={$questionnaire.sections}
      questionnaireMetaData={$questionnaireMetaData}
      grades={$questionnaireMetaData.grades}
      disableGrading={true}
    />

    <RoleBasedSecurity allowedRoles={[3]}>
      {#if $questionnaire.allowMultipleAttempts && !shouldShowPassedCompletionResult}
        <div class="mt-4">
          <Button type="button" variant="secondary" onclick={tryAgain}>
            {$t('course.navItem.lessons.exercises.all_exercises.view_mode.try_again')}
          </Button>
        </div>
      {/if}
    </RoleBasedSecurity>
  {/if}
{:else if hasSectionedExercise && currentSection && $questionnaireMetaData.sectionPhase === 'overview'}
  <ExerciseQuestion.SectionOverview
    sectionTitle={currentSectionDisplayTitle}
    sectionDescription={currentSection.description}
    sectionNumber={$questionnaireMetaData.currentSectionIndex + 1}
    totalSections={activeSections.length}
    questionCount={currentSectionQuestions.length}
    totalPoints={sectionQuestionTotalPoints}
    colorTheme={currentSection.colorTheme}
    onBegin={beginCurrentSection}
    onBack={goBackFromSectionOverview}
    labels={{
      beginSection: $t('course.navItem.lessons.exercises.all_exercises.view_mode.begin_section'),
      back: $t('course.navItem.lessons.exercises.all_exercises.view_mode.back'),
      questions: $t('course.navItem.lessons.exercises.all_exercises.view_mode.questions'),
      points: $t('course.navItem.lessons.exercises.all_exercises.view_mode.points'),
      section: $t('course.navItem.lessons.exercises.all_exercises.section.fallback_title')
    }}
  />
{:else if hasSectionedExercise && currentSection && $questionnaire.sectionDisplayMode === 'all_questions' && $questionnaireMetaData.sectionPhase === 'questions'}
  <div class="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)]">
    <ExerciseQuestion.SectionNavigationSidebar sections={sectionNavigationGroups} />
    <section class="space-y-4">
      <ExerciseQuestion.SectionHeader
        title={currentSectionDisplayTitle}
        description={currentSection.description}
        sectionNumber={$questionnaireMetaData.currentSectionIndex + 1}
        totalSections={activeSections.length}
        colorTheme={currentSection.colorTheme}
        questionCount={currentSectionQuestions.length}
        totalPoints={sectionQuestionTotalPoints}
        labels={{
          section: $t('course.navItem.lessons.exercises.all_exercises.section.fallback_title'),
          questions: $t('course.navItem.lessons.exercises.all_exercises.view_mode.questions'),
          points: $t('course.navItem.lessons.exercises.all_exercises.view_mode.points')
        }}
      />

      {#each currentSectionQuestions as sectionQuestion, sectionQuestionIndex (sectionQuestion.id)}
        {@const sectionQuestionModel = toExerciseQuestionModel(sectionQuestion)}
        {@const sectionQuestionKey = getExerciseQuestionContractKey(toExerciseQuestionModel(sectionQuestion))}
        <ExerciseQuestion.QuestionRenderer
          contract={{
            mode: 'take',
            question: sectionQuestionModel,
            answer: $questionnaireMetaData.answers[sectionQuestionKey],
            labels: questionLabels,
            disabled: isSubmitting,
            platformMaxFileSizeMb,
            onFileUpload: handleFileUpload,
            onVideoRecordingUpload: handleVideoRecordingUpload
          }}
          questionNumber={sectionQuestionIndex + 1}
          questionNumberActive={false}
          onAnswerChange={(answerValue) => onSectionQuestionAnswerChange(sectionQuestion, answerValue)}
        />
      {/each}

      <div class="flex justify-end">
        <Button type="button" onclick={completeAllQuestionsSection} disabled={isSubmitting} loading={isSubmitting}>
          {$questionnaireMetaData.currentSectionIndex === activeSections.length - 1
            ? $t('course.navItem.lessons.exercises.all_exercises.finish')
            : $t('course.navItem.lessons.exercises.all_exercises.view_mode.complete_section')}
        </Button>
      </div>
    </section>
  </div>
{:else if currentQuestion && currentQuestion?.id}
  <div class={hasSectionedExercise ? 'grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)]' : ''}>
    {#if hasSectionedExercise}
      <ExerciseQuestion.SectionNavigationSidebar sections={sectionNavigationGroups} />
    {/if}
    <div class="flex min-w-0 flex-col gap-4">
      {#if hasSectionedExercise && currentSection}
        <ExerciseQuestion.SectionHeader
          title={currentSectionDisplayTitle}
          description={currentSection.description}
          sectionNumber={$questionnaireMetaData.currentSectionIndex + 1}
          totalSections={activeSections.length}
          colorTheme={currentSection.colorTheme}
          questionCount={currentSectionQuestions.length}
          totalPoints={sectionQuestionTotalPoints}
          labels={{
            section: $t('course.navItem.lessons.exercises.all_exercises.section.fallback_title'),
            questions: $t('course.navItem.lessons.exercises.all_exercises.view_mode.questions'),
            points: $t('course.navItem.lessons.exercises.all_exercises.view_mode.points')
          }}
        />
      {/if}
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
                  platformMaxFileSizeMb,
                  onFileUpload: handleFileUpload,
                  onVideoRecordingUpload: handleVideoRecordingUpload
                }}
                questionNumber={$questionnaireMetaData.currentQuestionIndex}
                onAnswerChange={onSharedAnswerChange}
              />
            {/if}
          </div>
        {/key}
      </div>
      <div>
        <ExerciseQuestion.QuestionNavigation
          canGoBack={hasSectionedExercise || $questionnaireMetaData.currentQuestionIndex > 1}
          canGoNext={canGoNextForSharedQuestion && !isSubmitting}
          isLast={$questionnaireMetaData.currentQuestionIndex === currentQuestionList.length}
          {isSubmitting}
          previousLabel={t.get('course.navItem.lessons.exercises.all_exercises.previous')}
          nextLabel={t.get('course.navItem.lessons.exercises.all_exercises.next')}
          finishLabel={t.get('course.navItem.lessons.exercises.all_exercises.finish')}
          {onPrevious}
          onNext={onSharedNext}
        />
      </div>
    </div>
  </div>
{/if}
