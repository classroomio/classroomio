<script lang="ts">
  import { get } from 'svelte/store';
  import { goto } from '$app/navigation';
  import { Spinner } from '@cio/ui/base/spinner';
  import { Backdrop, Confetti } from '$features/ui';
  import { course, group, courseStore } from '../Course/store';
  import { isMobile } from '$lib/utils/store/useMobile';
  import { profile } from '$lib/utils/store/user';
  import * as Dialog from '@cio/ui/base/dialog';
  import { t } from '$lib/utils/functions/translations';
  import { Button } from '@cio/ui/base/button';
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
    isExercisePage = false,
    isFetching = $bindable(false),
    containerClass = '',
    onFetchingChange = (_v: boolean) => {},
    children,
    renderOnlyChildren = false
  }: Props = $props();

  const user: GroupPerson | undefined = $derived($group.people.find((person) => person.profile_id === $profile.id));

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
    <Spinner class="size-14! text-blue-700!" />
  </Backdrop>
{/if}

<Dialog.Root open={!isPermitted}>
  <Dialog.Content class="w-96">
    <Dialog.Header>
      <Dialog.Title>{$t('course.not_permitted.header')}</Dialog.Title>
    </Dialog.Header>
    <div>
      <p class="text-md text-center dark:text-white">
        {$t('course.not_permitted.body')}
      </p>

      <div class="mt-5 flex justify-center">
        <Button
          onclick={() => {
            goto('/org/*');
          }}
        >
          {$t('course.not_permitted.button')}
        </Button>
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>

{#if renderOnlyChildren}
  {@render children?.()}
{:else}
  <div class="root">
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
