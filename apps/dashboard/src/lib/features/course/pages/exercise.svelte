<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { Button } from '@cio/ui/base/button';
  import * as ButtonGroup from '@cio/ui/base/button-group';
  import * as UnderlineTabs from '@cio/ui/custom/underline-tabs';
  import EyeIcon from '@lucide/svelte/icons/eye';
  import PencilIcon from '@lucide/svelte/icons/pencil';
  import { onDestroy, onMount, tick, untrack } from 'svelte';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import CirclePlusIcon from '@lucide/svelte/icons/circle-plus';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import MoreHorizontalIcon from '@lucide/svelte/icons/more-horizontal';
  import * as Page from '@cio/ui/base/page';
  import { ContentType } from '@cio/utils/constants/content';

  import {
    type ExerciseEditorErrors,
    handleAddQuestion,
    handleAddSection,
    getQuestionsForSection,
    hasSections,
    questionnaire,
    questionnaireOrder,
    reset,
    mapZodErrorsToQuestionErrors,
    questionnaireValidation
  } from '$features/course/components/exercise/store';
  import { ZExerciseUpdate } from '@cio/utils/validation/exercise';
  import { mapZodErrorsToTranslations } from '$lib/utils/validation';
  import { transformQuestionsToApiFormat } from '$features/course/components/exercise/functions';
  import { isOrgStudent, isStudentExperience } from '$lib/utils/store/app';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import { exerciseApi } from '$features/course/api';
  import { courseApi } from '$features/course/api';
  import EditMode from '$features/course/components/exercise/edit-mode.svelte';
  import ExerciseSettingsTab from '$features/course/components/exercise/exercise-settings-tab.svelte';
  import ViewMode from '$features/course/components/exercise/view-mode.svelte';
  import Submissions from '$features/course/components/exercise/submissions/submissions.svelte';
  import UpdateDescription from '$features/course/components/exercise/update-description.svelte';
  import { ContentNavigationActions } from '$features/course/components/lesson';
  import {
    // RefreshPageData,
    RoleBasedSecurity,
    UnsavedChanges
  } from '$features/ui';
  import { isSelfPacedLikeCourse } from '$features/course/utils/compliance-utils';
  import { getOrderedNavigableContent } from '$features/course/utils/content';
  import {
    hydrateExercisePageData
    // , refreshExercisePageData
  } from '$features/course/utils/exercise-page-utils';
  import StudentContentLockedNotice from '$features/course/components/student-content-locked-notice.svelte';
  import {
    getQuestionTypeId,
    getQuestionTypeKeyFromId
  } from '$features/course/components/exercise/question-type-utils';
  import type { SubmissionListItem } from '$features/course/utils/types';
  import { Badge } from '@cio/ui/base/badge';
  import { isAutoGradableQuestionType } from '@cio/question-types';
  import * as Dialog from '@cio/ui/base/dialog';
  import type { ExerciseSectionState } from '$features/course/components/exercise/store';

  interface Props {
    exerciseId?: string;
    goBack?: () => void;
    isFetching?: boolean;
    submissions: SubmissionListItem[];
    mySubmissions?: SubmissionListItem[];
  }

  let {
    exerciseId = $bindable(''),
    goBack = () => {},
    isFetching = false,
    submissions,
    mySubmissions = []
  }: Props = $props();

  type ExerciseTab = 'questions' | 'settings' | 'submissions';

  function normalizeExerciseTab(tabParam: string | null): ExerciseTab {
    if (tabParam === 'submissions' || tabParam === 'analytics') {
      return 'submissions';
    }
    if (tabParam === 'settings') {
      return 'settings';
    }

    return 'questions';
  }

  let preview: boolean = $state(false);
  let shouldDeleteExercise = $state(false);
  let isSaving = $state(false);
  let isDeleting = $state(false);
  let reorderQuestions = $state(false);
  let selectedTab = $state<ExerciseTab>('questions');
  // eslint-disable-next-line svelte/prefer-writable-derived -- must be writable: cleared before intentional navigations and bound to UnsavedChanges
  let hasUnsavedChanges = $state(false);

  function isTemporaryId(id: string | number | undefined) {
    return typeof id === 'string' && id.includes('-form');
  }

  function hasDirtyQuestionnaire() {
    const hasDirtyQuestion = ($questionnaire.questions ?? []).some((question) => {
      const hasDirtyOption = (question.options ?? []).some((option) => option.isDirty || isTemporaryId(option.id));
      return question.isDirty || Boolean(question.deletedAt) || isTemporaryId(question.id) || hasDirtyOption;
    });
    const hasDirtySection = ($questionnaire.sections ?? []).some(
      (section) => section.isDirty || Boolean(section.deletedAt)
    );

    return Boolean(
      $questionnaire.isTitleDirty ||
        $questionnaire.isDescriptionDirty ||
        $questionnaire.isDueByDirty ||
        hasDirtyQuestion ||
        hasDirtySection
    );
  }

  async function handleDeleteExercise() {
    if (!courseApi.course?.id) return;
    isDeleting = true;

    await exerciseApi.delete(courseApi.course.id, exerciseId);

    if (exerciseApi.success) {
      hasUnsavedChanges = false;
      courseApi.removeContentItem(exerciseId, ContentType.Exercise);
      goBack();
    }
    isDeleting = false;
    shouldDeleteExercise = false;
  }

  function patchExerciseListItemLocally() {
    const nonDeletedQuestionsCount = ($questionnaire.questions || []).filter((question) => !question.deletedAt).length;

    courseApi.updateContentItem(exerciseId, ContentType.Exercise, {
      title: $questionnaire.title ?? '',
      dueBy: $questionnaire.dueBy || null,
      questionCount: nonDeletedQuestionsCount
    });
  }

  function getSectionValidationErrors(sections: ExerciseSectionState[]): ExerciseEditorErrors {
    const sectionErrors: ExerciseEditorErrors = {};
    const requiredFieldMessage = t.get('validations.generic.required_field');

    for (const section of sections) {
      const nextSectionErrors: ExerciseEditorErrors[string] = {};

      if (!section.title?.trim()) {
        nextSectionErrors.title = requiredFieldMessage;
      }

      if (Object.keys(nextSectionErrors).length === 0) continue;

      sectionErrors[section.id] = nextSectionErrors;
    }

    return sectionErrors;
  }

  async function handleSave() {
    if ($isOrgStudent || !courseApi.course?.id) return;

    // Transform questionnaire to API format for validation
    // Include all non-deleted options (even empty ones) so Zod can catch validation errors
    const transformedQuestions = transformQuestionsToApiFormat($questionnaire.questions, {
      shouldFilterEmptyLabels: false
    });
    const activeSections = $questionnaire.sections.filter((section) => !section.deletedAt);
    const sectionsPayload = activeSections.map((section) => ({
      id: section.id,
      title: section.title,
      description: section.description,
      order: section.order,
      colorTheme: section.colorTheme,
      afterBehavior: section.afterBehavior,
      questionIds: getQuestionsForSection($questionnaire.questions, section.id).map((question) => question.id)
    }));
    const shouldSyncSections = $questionnaire.sections.length > 0 || hasSections($questionnaire.sections);
    const sectionValidationErrors = getSectionValidationErrors(activeSections);

    // Validate using Zod schema
    const zodResult = ZExerciseUpdate.safeParse({
      questions: transformedQuestions,
      sections: shouldSyncSections ? sectionsPayload : undefined,
      sectionDisplayMode: $questionnaire.sectionDisplayMode
    });

    if (!zodResult.success || Object.keys(sectionValidationErrors).length > 0) {
      const zodErrors = !zodResult.success ? mapZodErrorsToTranslations(zodResult.error) : {};
      const questionErrors = mapZodErrorsToQuestionErrors(zodErrors, $questionnaire.questions);
      questionnaireValidation.set({
        ...questionErrors,
        ...sectionValidationErrors
      });
      snackbar.error('Please fix all validation errors before saving');
      return;
    }

    if (requiresPositivePointsForAutoGrade) {
      const zeroPointQuestions = ($questionnaire.questions ?? []).filter((q) => !q.deletedAt && Number(q.points) === 0);

      if (zeroPointQuestions.length > 0) {
        const pointErrors: Record<string, { option?: string; title?: string; points?: string }> = {};

        for (const q of zeroPointQuestions) {
          pointErrors[q.id] = {
            points: t.get('course.navItem.lessons.exercises.all_exercises.points_required_auto_grade')
          };
        }

        questionnaireValidation.set(pointErrors);

        snackbar.error('snackbar.exercise.points_required_auto_grade');

        return;
      }
    }

    isSaving = true;

    reset();
    try {
      // Transform questionnaire to API format (filter empty options for API, include deleted items)
      const questions = transformQuestionsToApiFormat($questionnaire.questions, {
        shouldFilterEmptyLabels: true,
        shouldIncludeDeleted: true
      });

      await exerciseApi.update(courseApi.course?.id, exerciseId, {
        title: $questionnaire.title ?? '',
        description: $questionnaire.description ?? '',
        dueBy: $questionnaire.dueBy ?? '',
        questions: questions,
        sections: shouldSyncSections ? sectionsPayload : undefined,
        sectionDisplayMode: $questionnaire.sectionDisplayMode
      });

      // Check if there are validation errors from the API
      if (Object.keys(exerciseApi.errors || {}).length > 0) {
        console.log('Validation errors from API:', exerciseApi.errors);
        snackbar.error('Please fix all validation errors before saving');
        isSaving = false;
        return;
      }

      if (exerciseApi.success) {
        if (exerciseApi.exercise) {
          hydrateExercisePageData(exerciseApi.exercise, exerciseId);
        }
        hasUnsavedChanges = false;
        patchExerciseListItemLocally();
        snackbar.success('snackbar.exercise.success');
      }
    } catch {
      snackbar.error();
    }
    isSaving = false;
  }

  onDestroy(() => {
    reset();
    questionnaire.update((q) => ({ ...q, questions: [] }));
  });

  onMount(() => {
    selectedTab = normalizeExerciseTab(page.url.searchParams.get('tab'));
  });

  $effect(() => {
    const nextTab = normalizeExerciseTab(page.url.searchParams.get('tab'));
    if (nextTab === untrack(() => selectedTab)) return;
    selectedTab = nextTab;
  });

  $effect(() => {
    hasUnsavedChanges = !$isOrgStudent && hasDirtyQuestionnaire();
  });

  $effect(() => {
    const hasActiveSections = hasSections($questionnaire.sections);
    if (!hasActiveSections && reorderQuestions) {
      reorderQuestions = false;
    }
  });

  $effect(() => {
    const currentTab = page.url.searchParams.get('tab') ?? '';
    // Prevent self-navigation loops: only update URL when it actually changes.
    if (currentTab === selectedTab) return;

    untrack(() => {
      const url = new URL(page.url);
      url.searchParams.set('tab', selectedTab);
      goto(resolve(`${url.pathname}${url.search}`, {}), {
        replaceState: true,
        keepFocus: true,
        noScroll: true
      });
    });
  });

  $effect(() => {
    if ($isOrgStudent) return;

    const addNewQ = $questionnaire?.questions?.length < 1;

    if (addNewQ) {
      untrack(() => {
        handleAddQuestion();
      });
    }
  });

  const exerciseContentItem = $derived(
    getOrderedNavigableContent(courseApi.course).find(
      (item) => item.type === ContentType.Exercise && item.id === exerciseId
    )
  );
  const isCourseContentReady = $derived(courseApi.course?.id != null);
  const isExerciseTeacherLocked = $derived((exerciseContentItem?.isUnlocked ?? true) === false);
  const isExerciseProgressionLocked = $derived(
    $isOrgStudent && exerciseContentItem?.accessible === false && !isExerciseTeacherLocked
  );
  const isExerciseAccessible = $derived.by(() => {
    if ($isOrgStudent && (!isCourseContentReady || !exerciseContentItem)) {
      return false;
    }

    return !isExerciseTeacherLocked && !isExerciseProgressionLocked;
  });
  const exerciseDisplayTitle = $derived(
    exerciseContentItem?.title ||
      $questionnaire.title ||
      t.get('course.navItem.lessons.exercises.all_exercises.heading')
  );

  const isSelfPacedCourse = $derived(isSelfPacedLikeCourse(courseApi.course?.type));
  const isPublicCourse = $derived(courseApi.course?.type === 'PUBLIC');
  const activeQuestionTypeIds = $derived(
    ($questionnaire.questions ?? []).filter((q) => !q.deletedAt).map((q) => getQuestionTypeId(q))
  );
  function isExerciseFullyAutoGradable(typeIds: number[]): boolean {
    return typeIds.length > 0 && typeIds.every((id) => isAutoGradableQuestionType(getQuestionTypeKeyFromId(id)));
  }

  const isFullyAutoGradable = $derived(isExerciseFullyAutoGradable(activeQuestionTypeIds));

  /** When true, every question must have points &gt; 0 before save (for meaningful auto-grading) */
  const requiresPositivePointsForAutoGrade = $derived(isFullyAutoGradable);

  const teacherAutoGradeBadge = $derived.by(() => {
    if ($isOrgStudent || isPublicCourse || activeQuestionTypeIds.length === 0) return null;
    return isFullyAutoGradable ? ('auto' as const) : ('manual' as const);
  });

  async function scrollToExerciseElement(elementId: string) {
    await tick();
    requestAnimationFrame(() => {
      document.getElementById(elementId)?.scrollIntoView({
        block: 'start',
        behavior: 'smooth',
        inline: 'nearest'
      });
    });
  }

  $inspect('$isStudentExperience', $isStudentExperience);
  $inspect('isExerciseAccessible', isExerciseAccessible);
  $inspect('isExerciseAccessible', isExerciseAccessible);
  $inspect('mySubmissions', mySubmissions);

  function getFirstActiveSectionId() {
    const [firstActiveSection] = [...($questionnaire.sections ?? [])]
      .filter((section) => !section.deletedAt)
      .sort((leftSection, rightSection) => leftSection.order - rightSection.order);

    return firstActiveSection?.id ?? null;
  }

  async function addQuestionFromHeader() {
    preview = false;
    const questionId = handleAddQuestion(getFirstActiveSectionId());
    await scrollToExerciseElement(`exercise-question-${questionId}`);
  }

  async function addSectionFromHeader() {
    preview = false;
    const sectionId = handleAddSection();
    await scrollToExerciseElement(`exercise-section-${sectionId}`);
  }

  function togglePreviewMode() {
    preview = !preview;
    reorderQuestions = false;
  }
</script>

<Page.Header isSticky={true} class="top-12! min-h-[36px]">
  <Page.HeaderContent>
    <Page.Title class="flex flex-col gap-2">
      <span>{exerciseDisplayTitle}</span>
      <RoleBasedSecurity allowedRoles={[1, 2]}>
        {#if teacherAutoGradeBadge === 'auto'}
          <Badge variant="outline" class="font-normal">
            {$t('course.navItem.lessons.exercises.all_exercises.auto_graded_badge')}
          </Badge>
        {:else if teacherAutoGradeBadge === 'manual'}
          <Badge variant="warning" class="font-normal">
            {$t('course.navItem.lessons.exercises.all_exercises.manual_grading_required_badge')}
          </Badge>
        {/if}
      </RoleBasedSecurity>
    </Page.Title>
  </Page.HeaderContent>
  <Page.Action>
    <div class="flex items-center gap-2">
      {#if $isStudentExperience && courseApi.course?.id && exerciseId}
        <ContentNavigationActions courseId={courseApi.course.id} {exerciseId} />
      {/if}

      <RoleBasedSecurity allowedRoles={[1, 2]}>
        {#if selectedTab === 'questions'}
          <div class="right-0 flex w-full items-center justify-end">
            <div class="flex flex-wrap items-center justify-end gap-2">
              <ButtonGroup.Root>
                <Button variant="outline" size="sm" onclick={addQuestionFromHeader}>
                  <CirclePlusIcon size={16} />
                  {$t('course.navItem.lessons.exercises.all_exercises.add_question')}
                </Button>
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger>
                    {#snippet child({ props })}
                      <Button
                        {...props}
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label={$t('course.navItem.lessons.exercises.all_exercises.add')}
                      >
                        <ChevronDownIcon size={16} />
                      </Button>
                    {/snippet}
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content align="end" class="z-201!">
                    <DropdownMenu.Item onclick={addSectionFromHeader}>
                      {$t('course.navItem.lessons.exercises.all_exercises.add_section')}
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              </ButtonGroup.Root>

              <ButtonGroup.Root>
                <Button variant="outline" size="sm" onclick={togglePreviewMode}>
                  {#if preview}
                    <PencilIcon size={16} />
                    {$t('course.navItem.lessons.exercises.all_exercises.view_mode.edit')}
                  {:else}
                    <EyeIcon size={16} />
                    {$t('course.navItem.lessons.exercises.all_exercises.preview')}
                  {/if}
                </Button>
              </ButtonGroup.Root>

              <ButtonGroup.Root>
                <Button size="sm" onclick={handleSave} loading={isSaving}>
                  {$t('course.navItem.lessons.exercises.all_exercises.save')}
                </Button>
                <ButtonGroup.Separator />
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger>
                    {#snippet child({ props })}
                      <Button
                        {...props}
                        type="button"
                        variant="default"
                        size="icon-sm"
                        aria-label={$t('course.navItem.lessons.exercises.all_exercises.more')}
                      >
                        <MoreHorizontalIcon class="h-4 w-4" />
                      </Button>
                    {/snippet}
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content align="end" class="z-201!">
                    {#if hasSections($questionnaire.sections)}
                      <DropdownMenu.Item onclick={() => (reorderQuestions = !reorderQuestions)}>
                        {reorderQuestions
                          ? $t('course.navItem.lessons.exercises.all_exercises.reorder_done')
                          : $t('course.navItem.lessons.exercises.all_exercises.reorder')}
                      </DropdownMenu.Item>
                    {:else}
                      <DropdownMenu.Item onclick={() => ($questionnaireOrder.open = true)}>
                        {$t('course.navItem.lessons.exercises.all_exercises.reorder')}
                      </DropdownMenu.Item>
                    {/if}
                    <DropdownMenu.Item
                      disabled={!courseApi.course?.id || !exerciseId}
                      onclick={() => {
                        if (courseApi.course?.id && exerciseId) {
                          exerciseApi.notifyStudents(courseApi.course.id, exerciseId);
                        }
                      }}
                    >
                      {$t('course.navItem.lessons.exercises.all_exercises.notify.action')}
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item
                      class="text-red-600 focus:text-red-600 dark:text-red-400"
                      onclick={() => (shouldDeleteExercise = true)}
                    >
                      {$t('course.navItem.lessons.exercises.all_exercises.delete_exercise')}
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              </ButtonGroup.Root>
            </div>
          </div>
        {/if}

        <!-- <RefreshPageData onRefresh={() => refreshExercisePageData(courseApi.course?.id ?? '', exerciseId)} /> -->
      </RoleBasedSecurity>
    </div>
  </Page.Action>
</Page.Header>

<Page.Body>
  {#snippet child()}
    <div class="overflow-x-hidden pb-20">
      {#if $isStudentExperience}
        {#if isExerciseAccessible}
          <ViewMode {preview} {exerciseId} isFetchingExercise={isFetching} {mySubmissions} />
        {:else}
          <StudentContentLockedNotice
            reason={isExerciseProgressionLocked ? 'progression_locked' : 'teacher_locked'}
            contentType={ContentType.Exercise}
          />
        {/if}
      {:else}
        <UnderlineTabs.Root bind:value={selectedTab} class="mb-4">
          <UnderlineTabs.List class="grid w-full max-w-lg grid-cols-3">
            <UnderlineTabs.Trigger value="questions">
              {$t('course.navItem.lessons.exercises.all_exercises.questions')}
            </UnderlineTabs.Trigger>
            <UnderlineTabs.Trigger value="settings">
              {$t('course.navItem.lessons.exercises.all_exercises.settings')}
            </UnderlineTabs.Trigger>
            <UnderlineTabs.Trigger value="submissions">
              {$t('course.navItem.lessons.exercises.all_exercises.analytics.submissions')}

              <Badge variant="outline">{submissions.length}</Badge>
            </UnderlineTabs.Trigger>
          </UnderlineTabs.List>
          <UnderlineTabs.Content value="questions" class="mx-auto w-full md:max-w-3xl">
            <UpdateDescription {preview} />
            {#if !preview}
              <EditMode
                {exerciseId}
                {goBack}
                {requiresPositivePointsForAutoGrade}
                selfPacedCourse={isSelfPacedCourse}
                {isPublicCourse}
                {reorderQuestions}
              />
            {:else}
              <ViewMode {preview} {exerciseId} isFetchingExercise={isFetching} {mySubmissions} />
            {/if}
          </UnderlineTabs.Content>
          <UnderlineTabs.Content value="settings">
            <ExerciseSettingsTab {exerciseId} />
          </UnderlineTabs.Content>
          <UnderlineTabs.Content value="submissions">
            <Submissions bind:exerciseId {submissions} />
          </UnderlineTabs.Content>
        </UnderlineTabs.Root>

        <Dialog.Root
          bind:open={shouldDeleteExercise}
          onOpenChange={(isOpen) => {
            if (!isOpen) shouldDeleteExercise = false;
          }}
        >
          <Dialog.Content class="w-2/4">
            <Dialog.Header>
              <Dialog.Title>{$t('course.navItem.lessons.exercises.all_exercises.edit_mode.delete_modal')}</Dialog.Title>
            </Dialog.Header>
            <form onsubmit={(e) => e.preventDefault()}>
              <h1 class="text-xl dark:text-white">
                {$t('course.navItem.lessons.exercises.all_exercises.edit_mode.sure')}
              </h1>

              <div class="mt-5 flex items-center justify-between">
                <Button variant="outline" type="submit" onclick={() => (shouldDeleteExercise = false)}>
                  {$t('course.navItem.lessons.exercises.all_exercises.edit_mode.no')}
                </Button>
                <Button disabled={isDeleting} onclick={handleDeleteExercise} loading={isDeleting}>
                  {isDeleting
                    ? $t('course.navItem.lessons.exercises.all_exercises.edit_mode.deleting')
                    : $t('course.navItem.lessons.exercises.all_exercises.edit_mode.yes')}
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Root>
      {/if}
    </div>
  {/snippet}
</Page.Body>

<UnsavedChanges bind:hasUnsavedChanges />
