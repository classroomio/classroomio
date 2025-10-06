<script lang="ts">
  // import { run } from 'svelte/legacy';
  import { get } from 'svelte/store';
  import { goto } from '$app/navigation';
  import { Moon } from 'svelte-loading-spinners';
  import Navigation from '../Course/components/Navigation/index.svelte';
  import Backdrop from '$lib/components/Backdrop/index.svelte';
  import { course, group, courseStore } from '../Course/store';
  import Confetti from '../Confetti/index.svelte';
  import { isMobile } from '$lib/utils/store/useMobile';
  import { profile } from '$lib/utils/store/user';
  import { globalStore } from '$lib/utils/store/app';
  import Modal from '$lib/components/Modal/index.svelte';
  import { t } from '$lib/utils/functions/translations';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { isOrgAdmin } from '$lib/utils/store/org';
  import type { GroupPerson } from '$lib/utils/types';

  interface Props {
    courseId: string;
    path?: string;
    isExercisePage?: boolean;
    isFetching?: boolean;
    containerClass?: string;
    onFetchingChange?: (v: boolean) => void;
    children?: import('svelte').Snippet;
    renderOnlyChildren?: boolean;
  }

  let {
    courseId,
    path = '',
    isExercisePage = false,
    isFetching = $bindable(false),
    containerClass = '',
    onFetchingChange = (_v: boolean) => {},
    children,
    renderOnlyChildren = false
  }: Props = $props();

  const user: GroupPerson | undefined = $derived(
    $group.people.find((person) => person.profile_id === $profile.id)
  );

  const canCheck = $derived($profile.id && $group.id);

  const isPermitted = $derived.by(() => {
    if (!canCheck) return true;

    if ($isOrgAdmin === null) return true;

    return $isOrgAdmin || user;
  });

  $effect(() => {
    const isLoading = get(courseStore.isLoading);
    onFetchingChange(isLoading);
  });

  $effect(() => {
    courseStore.fetch(courseId);
  });
</script>

<svelte:head>
  <title>{$course.title || 'ClassroomIO Course'}</title>
</svelte:head>

{#if isFetching}
  <Backdrop>
    <Moon size="60" color="#1d4ed8" unit="px" duration="1s" />
  </Backdrop>
{/if}

<Modal open={!isPermitted} width="w-96" modalHeading={$t('course.not_permitted.header')}>
  <div>
    <p class="text-md text-center dark:text-white">
      {$t('course.not_permitted.body')}
    </p>

    <div class="mt-5 flex justify-center">
      <PrimaryButton
        className="px-6 py-3"
        label={$t('course.not_permitted.button')}
        onClick={() => {
          goto('/org/*');
        }}
      />
    </div>
  </div>
</Modal>

{#if renderOnlyChildren}
  {@render children?.()}
{:else}
  <div class="root">
    <Navigation {path} isStudent={$globalStore.isStudent} />
    <div class="rightBar {containerClass}" class:isMobile={$isMobile}>
      {#if isExercisePage}
        <Confetti />
      {/if}

      <!-- Show only if permitted -->
      {#if isPermitted}
        {@render children?.()}
      {/if}
    </div>
  </div>
{/if}

<style>
  .root {
    display: flex;
    width: 100%;
  }

  .rightBar {
    flex-grow: 1;
    width: calc(100% - 360px);
  }
</style>
