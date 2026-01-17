<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { Button } from '@cio/ui/base/button';
  import EyeIcon from '@lucide/svelte/icons/eye';
  import { onDestroy, onMount, untrack } from 'svelte';
  import * as Breadcrumb from '@cio/ui/base/breadcrumb';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import CirclePlusIcon from '@lucide/svelte/icons/circle-plus';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';

  import {
    handleAddQuestion,
    questionnaire,
    questionnaireOrder,
    reset,
    mapZodErrorsToQuestionErrors,
    questionnaireValidation
  } from '../store/exercise';
  import { ZExerciseUpdate } from '@cio/utils/validation/exercise';
  import { mapZodErrorsToTranslations } from '$lib/utils/validation';
  import { transformQuestionsToApiFormat } from './functions';
  import { globalStore } from '$lib/utils/store/app';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import { exerciseApi } from '$features/course/api';
  import { courseApi } from '$features/course/api';
  import EditMode from './edit-mode.svelte';
  import ViewMode from './view-mode.svelte';
  import Analytics from './submissions/index.svelte';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import UpdateDescription from './update-description.svelte';
  import { RoleBasedSecurity } from '$features/ui';

  interface Props {
    exerciseId?: string;
    path?: string;
    goBack?: any;
    isFetching?: boolean;
  }

  let { exerciseId = $bindable(''), path = '', goBack = () => {}, isFetching = false }: Props = $props();

  let preview: boolean = $state(false);
  let shouldDeleteExercise = $state(false);
  let isSaving = $state(false);
  let selectedTab = $state('questions');

  async function handleSave() {
    if ($globalStore.isStudent || !courseApi.course?.id) return;

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

      if (exerciseApi.success && exerciseApi.exercise) {
        questionnaire.update((q) => ({
          ...q,
          isTitleDirty: false,
          isDescriptionDirty: false,
          questions: exerciseApi.exercise?.questions || q.questions
        }));
        snackbar.success('snackbar.exercise.success');

        // Redirect to exercises page
        goto(path);
      }
    } catch (error) {
      snackbar.error();
    }
    isSaving = false;
  }

  onDestroy(() => {
    reset();
  });

  onMount(() => {
    const tabParam = page.url.searchParams.get('tab');
    if (tabParam) {
      selectedTab = tabParam;
    }
  });

  $effect(() => {
    const currentTab = page.url.searchParams.get('tab') || '';
    // Prevent self-navigation loops: only update URL when it actually changes.
    if (currentTab === selectedTab) return;

    untrack(() => {
      const url = new URL(page.url);
      url.searchParams.set('tab', selectedTab);
      goto(url.pathname + url.search, {
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
</script>

<div class="overflow-x-hidden px-4">
  <div class="sticky top-0 z-10 mb-3 bg-gray-100 p-2 dark:bg-neutral-800">
    <Breadcrumb.Root>
      <Breadcrumb.List>
        <Breadcrumb.Item>
          <Breadcrumb.Link href={path}>
            {$t('course.navItem.lessons.exercises.all_exercises.heading')}
          </Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Separator />
        <Breadcrumb.Item>
          <Breadcrumb.Page>
            {$questionnaire.title}
          </Breadcrumb.Page>
        </Breadcrumb.Item>
      </Breadcrumb.List>
    </Breadcrumb.Root>

    <RoleBasedSecurity allowedRoles={[1, 2]}>
      <!-- <Tabs.Root bind:value={selectedTab} class="w-full">
        <Tabs.List class="mb-2">
          <Tabs.Trigger value="questions">
            {$t('course.navItem.lessons.exercises.all_exercises.questions')} ({$questionnaire.questions.length})
          </Tabs.Trigger>
          <Tabs.Trigger value="submissions">
            {$t('course.navItem.lessons.exercises.all_exercises.submissions')} ({$questionnaire.totalSubmissions})
          </Tabs.Trigger>
        </Tabs.List>
      </Tabs.Root> -->

      {#if selectedTab === 'questions'}
        <div class="right-0 flex w-full items-center justify-end">
          <div class="flex items-center">
            <Button class="mr-2" onclick={handleSave} loading={isSaving}>
              {$t('course.navItem.lessons.exercises.all_exercises.save')}
            </Button>
            <IconButton
              onclick={() => (preview = !preview)}
              tooltip={$t('course.navItem.lessons.exercises.all_exercises.preview')}
              tooltipSide="bottom"
            >
              <EyeIcon size={20} class={preview ? 'filled' : ''} />
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
    </RoleBasedSecurity>
  </div>

  {#if selectedTab === 'questions'}
    <RoleBasedSecurity allowedRoles={[1, 2]}>
      <UpdateDescription {preview} />
    </RoleBasedSecurity>
    {#if !$globalStore.isStudent && !preview}
      <EditMode bind:shouldDeleteExercise {exerciseId} {goBack} />
    {:else}
      <ViewMode {preview} {exerciseId} isFetchingExercise={isFetching} />
    {/if}
  {:else if selectedTab === 'submissions'}
    <Analytics bind:exerciseId />
  {/if}
</div>
