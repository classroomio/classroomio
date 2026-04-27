<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { Button } from '@cio/ui/base/button';
  import * as UnderlineTabs from '@cio/ui/custom/underline-tabs';
  import EyeIcon from '@lucide/svelte/icons/eye';
  import PencilIcon from '@lucide/svelte/icons/pencil';
  import { onDestroy, onMount, untrack } from 'svelte';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import CirclePlusIcon from '@lucide/svelte/icons/circle-plus';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import * as Page from '@cio/ui/base/page';
  import { ContentType } from '@cio/utils/constants/content';

  import {
    handleAddQuestion,
    questionnaire,
    questionnaireOrder,
    reset,
    mapZodErrorsToQuestionErrors,
    questionnaireValidation
  } from '$features/course/components/exercise/store';
  import { ZExerciseUpdate } from '@cio/utils/validation/exercise';
  import { mapZodErrorsToTranslations } from '$lib/utils/validation';
  import { transformQuestionsToApiFormat } from '$features/course/components/exercise/functions';
  import { isOrgStudent } from '$lib/utils/store/app';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import { exerciseApi } from '$features/course/api';
  import { courseApi } from '$features/course/api';
  import EditMode from '$features/course/components/exercise/edit-mode.svelte';
  import ExerciseSettingsTab from '$features/course/components/exercise/exercise-settings-tab.svelte';
  import ViewMode from '$features/course/components/exercise/view-mode.svelte';
  import Submissions from '$features/course/components/exercise/submissions/submissions.svelte';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import UpdateDescription from '$features/course/components/exercise/update-description.svelte';
  import { ContentNavigationActions } from '$features/course/components/lesson';
  import { RefreshPageData, RoleBasedSecurity } from '$features/ui';
  import { isSelfPacedLikeCourse } from '$features/course/utils/compliance-utils';
  import { getOrderedNavigableContent } from '$features/course/utils/content';
  import { refreshExercisePageData } from '$features/course/utils/exercise-page-utils';
  import { Empty } from '@cio/ui/custom/empty';
  import VideoIcon from '@lucide/svelte/icons/video';
  import {
    getQuestionTypeId,
    getQuestionTypeKeyFromId,
    getQuestionTypeOptionById
  } from '$features/course/components/exercise/question-type-utils';
  import type { SubmissionListItem } from '$features/course/utils/types';
  import { Badge } from '@cio/ui/base/badge';
  import { isAutoGradableQuestionType } from '@cio/question-types';
  import * as Dialog from '@cio/ui/base/dialog';

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
  let selectedTab = $state<ExerciseTab>('questions');

  async function handleDeleteExercise() {
    if (!courseApi.course?.id) return;
    isDeleting = true;

    await exerciseApi.delete(courseApi.course.id, exerciseId);

    if (exerciseApi.success) {
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

  async function handleSave() {
    if ($isOrgStudent || !courseApi.course?.id) return;

    // Transform questionnaire to API format for validation
    // Include all non-deleted options (even empty ones) so Zod can catch validation errors
    const transformedQuestions = transformQuestionsToApiFormat($questionnaire.questions, {
      shouldFilterEmptyLabels: false
    });

    // Validate using Zod schema
    const zodResult = ZExerciseUpdate.safeParse({
      questions: transformedQuestions
    });

    if (!zodResult.success) {
      const zodErrors = mapZodErrorsToTranslations(zodResult.error);
      const questionErrors = mapZodErrorsToQuestionErrors(zodErrors, $questionnaire.questions);
      questionnaireValidation.set(questionErrors);
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
        questions: questions
      });

      // Check if there are validation errors from the API
      if (Object.keys(exerciseApi.errors || {}).length > 0) {
        console.log('Validation errors from API:', exerciseApi.errors);
        snackbar.error('Please fix all validation errors before saving');
        isSaving = false;
        return;
      }

      if (exerciseApi.success) {
        questionnaire.update((q) => ({
          ...q,
          isTitleDirty: false,
          isDescriptionDirty: false,
          questions:
            exerciseApi.exercise?.questions?.map((question) => {
              const questionType = getQuestionTypeOptionById(getQuestionTypeId(question));
              return {
                ...question,
                questionTypeId: questionType.id,
                questionType
              };
            }) || q.questions
        }));
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
  const isExerciseUnlocked = $derived(exerciseContentItem?.isUnlocked ?? false);

  const isSelfPacedCourse = $derived(isSelfPacedLikeCourse(courseApi.course?.type));
  const activeQuestionTypeIds = $derived(
    ($questionnaire.questions ?? []).filter((q) => !q.deletedAt).map((q) => getQuestionTypeId(q))
  );
  function isExerciseFullyAutoGradable(typeIds: number[]): boolean {
    return typeIds.length > 0 && typeIds.every((id) => isAutoGradableQuestionType(getQuestionTypeKeyFromId(id)));
  }

  /** When true, every question must have points &gt; 0 before save */
  const requiresPositivePointsForAutoGrade = $derived(
    isSelfPacedCourse && isExerciseFullyAutoGradable(activeQuestionTypeIds)
  );
  const teacherAutoGradeBadge = $derived.by(() => {
    if ($isOrgStudent || !isSelfPacedCourse || activeQuestionTypeIds.length === 0) return null;
    return isExerciseFullyAutoGradable(activeQuestionTypeIds) ? ('auto' as const) : ('manual' as const);
  });
</script>

<Page.Header isSticky={true} class="z-50! min-h-[36px]">
  <Page.HeaderContent>
    <Page.Title class="flex flex-wrap items-center gap-2">
      <span>{$questionnaire.title || 'Exercise'}</span>
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
      {#if $isOrgStudent && courseApi.course?.id && exerciseId}
        <ContentNavigationActions courseId={courseApi.course.id} {exerciseId} />
      {/if}

      <RoleBasedSecurity allowedRoles={[1, 2]}>
        {#if selectedTab === 'questions'}
          <div class="right-0 flex w-full items-center justify-end">
            <div class="flex items-center gap-2">
              <Button class="mr-2" onclick={handleSave} loading={isSaving}>
                {$t('course.navItem.lessons.exercises.all_exercises.save')}
              </Button>
              <IconButton
                onclick={() => (preview = !preview)}
                tooltip={preview
                  ? $t('course.navItem.lessons.exercises.all_exercises.view_mode.edit')
                  : $t('course.navItem.lessons.exercises.all_exercises.preview')}
                tooltipSide="bottom"
              >
                {#if preview}
                  <PencilIcon size={20} />
                {:else}
                  <EyeIcon size={20} />
                {/if}
              </IconButton>
              <IconButton
                onclick={handleAddQuestion}
                tooltip={$t('course.navItem.lessons.exercises.all_exercises.add_question')}
                tooltipSide="bottom"
              >
                <CirclePlusIcon size={20} />
              </IconButton>
              <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                  <Button variant="ghost" size="icon" class="h-8 w-8">
                    <EllipsisVerticalIcon class="h-5 w-5" />
                    <span class="sr-only">Open menu</span>
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="end">
                  <DropdownMenu.Item onclick={() => ($questionnaireOrder.open = true)}>
                    {$t('course.navItem.lessons.exercises.all_exercises.reorder')}
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
            </div>
          </div>
        {/if}

        <RefreshPageData onRefresh={() => refreshExercisePageData(courseApi.course?.id ?? '', exerciseId)} />
      </RoleBasedSecurity>
    </div>
  </Page.Action>
</Page.Header>

<Page.Body>
  {#snippet child()}
    <div class="overflow-x-hidden">
      {#if $isOrgStudent}
        {#if isExerciseUnlocked}
          <ViewMode {preview} {exerciseId} isFetchingExercise={isFetching} {mySubmissions} />
        {:else}
          <Empty
            title={$t('course.navItem.lessons.content_locked_title')}
            description={$t('course.navItem.lessons.content_locked_description')}
            icon={VideoIcon}
            variant="page"
            class="text-center"
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
          <UnderlineTabs.Content value="questions">
            <UpdateDescription {preview} />
            {#if !preview}
              <EditMode
                {exerciseId}
                {goBack}
                {requiresPositivePointsForAutoGrade}
                selfPacedCourse={isSelfPacedCourse}
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
