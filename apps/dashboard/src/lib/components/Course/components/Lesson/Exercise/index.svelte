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
    validateQuestionnaire
  } from '../store/exercise';
  import { globalStore } from '$lib/utils/store/app';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { upsertExercise } from '$lib/utils/services/courses';
  import EditMode from './EditMode.svelte';
  import ViewMode from './ViewMode.svelte';
  import { PageBody } from '$lib/components/Page';
  import Analytics from './Submissions/index.svelte';
  import { IconButton } from '$lib/components/IconButton';
  import UpdateDescription from './UpdateDescription.svelte';
  import { RoleBasedSecurity } from '$lib/features/ui';

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
    if ($globalStore.isStudent) return;

    const errors = validateQuestionnaire($questionnaire.questions);
    if (Object.values(errors).length > 0) {
      return;
    }

    isSaving = true;

    reset();

    try {
      const updatedQuestions = await upsertExercise($questionnaire, exerciseId);

      questionnaire.update((q) => ({
        ...q,
        is_title_dirty: false,
        is_description_dirty: false,
        // @ts-ignore
        questions: updatedQuestions
      }));
      snackbar.success('snackbar.exercise.success');

      // Redirect to exercises page
      goto(path);
    } catch (error) {
      console.error(error);
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
    untrack(() => {
      goto(page.url.pathname + '?tab=' + selectedTab);
    });
  });
  // $effect(() => {
  //   const addNewQ = $questionnaire?.questions?.length < 1;
  //   console.log('addNewQ', addNewQ);

  //   if (addNewQ) {
  //     untrack(() => {
  //       handleAddQuestion();
  //     });
  //   }
  // });
</script>

<PageBody isPageNavHidden={$globalStore.isStudent} padding="px-4 overflow-x-hidden">
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
              onClick={() => (preview = !preview)}
              contained={preview}
              toolTipProps={{
                title: $t('course.navItem.lessons.exercises.all_exercises.preview'),
                direction: 'bottom',
                hotkeys: []
              }}
            >
              <EyeIcon size={20} class={preview ? 'filled' : ''} />
            </IconButton>
            <IconButton
              onClick={handleAddQuestion}
              toolTipProps={{
                title: $t('course.navItem.lessons.exercises.all_exercises.add_question'),
                direction: 'bottom',
                hotkeys: []
              }}
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
</PageBody>
