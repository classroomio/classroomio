<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import { PageBody } from '$lib/components/Page';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import RoleBasedSecurity from '$lib/components/RoleBasedSecurity/index.svelte';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { t } from '$lib/utils/functions/translations';
  import { upsertExercise } from '$lib/utils/services/courses';
  import { globalStore } from '$lib/utils/store/app';
  import {
    Breadcrumb,
    BreadcrumbItem,
    ContentSwitcher,
    OverflowMenu,
    OverflowMenuItem,
    Switch
  } from 'carbon-components-svelte';
  import AddAltIcon from 'carbon-icons-svelte/lib/AddAlt.svelte';
  import ViewIcon from 'carbon-icons-svelte/lib/View.svelte';
  import ViewFilledIcon from 'carbon-icons-svelte/lib/ViewFilled.svelte';
  import { onDestroy, onMount } from 'svelte';
  import {
    handleAddQuestion,
    questionnaire,
    questionnaireOrder,
    reset,
    validateQuestionnaire
  } from '../store/exercise';
  import EditMode from './EditMode.svelte';
  import Analytics from './Submissions/index.svelte';
  import UpdateDescription from './UpdateDescription.svelte';
  import ViewMode from './ViewMode.svelte';

  export let exerciseId = '';
  export let path = '';
  export let goBack = () => {};
  export let isFetching = false;

  let preview: boolean = false;
  let shouldDeleteExercise = false;
  let isSaving = false;
  let selectedIndex = 0;

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

  $: onSelectedIndexChange(selectedIndex);
  function onSelectedIndexChange(index: number) {
    goto($page.url.pathname + '?tabIndex=' + index);
  }

  onMount(() => {
    const tabIndex = $page.url.searchParams.get('tabIndex');
    if (tabIndex) {
      selectedIndex = parseInt(tabIndex);
    }
  });

  $: $questionnaire?.questions?.length < 1 && handleAddQuestion();
</script>

<PageBody bind:isPageNavHidden={$globalStore.isStudent} padding="px-4 overflow-x-hidden">
  <div class="sticky top-0 z-10 mb-3 bg-gray-100 p-2 dark:bg-neutral-800">
    <Breadcrumb noTrailingSlash>
      <BreadcrumbItem href={path}>
        {$t('course.navItem.lessons.exercises.all_exercises.heading')}
      </BreadcrumbItem>
      <BreadcrumbItem href={`${path}/${exerciseId}`} isCurrentPage>
        {$questionnaire.title}
      </BreadcrumbItem>
    </Breadcrumb>

    <RoleBasedSecurity allowedRoles={[1, 2]}>
      <ContentSwitcher bind:selectedIndex class="mb-2">
        <Switch
          text="{$t('course.navItem.lessons.exercises.all_exercises.questions')} ({$questionnaire
            .questions.length})"
        />
        <Switch
          text="{$t(
            'course.navItem.lessons.exercises.all_exercises.submissions'
          )} ({$questionnaire.totalSubmissions})"
        />
      </ContentSwitcher>

      {#if selectedIndex === 0}
        <div class="right-0 flex w-full items-center justify-end">
          <div class="flex items-center">
            <PrimaryButton
              className="mr-2"
              variant={VARIANTS.CONTAINED}
              label={$t('course.navItem.lessons.exercises.all_exercises.save')}
              onClick={handleSave}
              isLoading={isSaving}
            />
            <IconButton
              onClick={() => (preview = !preview)}
              contained={preview}
              toolTipProps={{
                title: $t('course.navItem.lessons.exercises.all_exercises.preview'),
                direction: 'bottom',
                hotkeys: []
              }}
            >
              {#if preview}
                <ViewFilledIcon size={24} class="carbon-icon dark:text-white" />
              {:else}
                <ViewIcon size={24} class="carbon-icon dark:text-white" />
              {/if}
            </IconButton>
            <IconButton onClick={() => handleAddQuestion()} size="small">
              <AddAltIcon size={24} class="carbon-icon dark:text-white" />
            </IconButton>
            <OverflowMenu flipped>
              <OverflowMenuItem
                text={$t('course.navItem.lessons.exercises.all_exercises.reorder')}
                on:click={() => ($questionnaireOrder.open = true)}
              />
              <OverflowMenuItem
                danger
                text={$t('course.navItem.lessons.exercises.all_exercises.delete_exercise')}
                on:click={() => (shouldDeleteExercise = true)}
              />
            </OverflowMenu>
          </div>
        </div>
      {/if}
    </RoleBasedSecurity>
  </div>

  {#if selectedIndex === 0}
    <RoleBasedSecurity allowedRoles={[1, 2]}>
      <UpdateDescription {preview} />
    </RoleBasedSecurity>
    {#if !$globalStore.isStudent && !preview}
      <EditMode bind:shouldDeleteExercise {exerciseId} {goBack} />
    {:else}
      <ViewMode {preview} {exerciseId} isFetchingExercise={isFetching} />
    {/if}
  {:else if selectedIndex === 1}
    <Analytics bind:exerciseId />
  {/if}
</PageBody>
