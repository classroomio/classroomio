<script lang="ts">
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { Moon } from 'svelte-loading-spinners';
  import {
    courses,
    group,
    pathway,
    defaultPathway,
    setPathway
  } from '$lib/components/Pathways/store';
  import { profile } from '$lib/utils/store/user';
  import { isOrgAdmin } from '$lib/utils/store/org';
  import { globalStore } from '$lib/utils/store/app';
  import { t } from '$lib/utils/functions/translations';
  import { fetchPathway } from '$lib/utils/services/pathways';
  import Modal from '$lib/components/Modal/index.svelte';
  import Backdrop from '$lib/components/Backdrop/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import PathwaySidebar from '$lib/components/Pathways/components/Sidebar.svelte';

  export let pathwayId = '';
  export let path = '';
  export let className: string = '';
  export let isFetching = false;

  let prevPathwayId = '';
  let isPermitted = true;

  async function onPathwayIdChange(pathwayId = '') {
    if (!pathwayId || prevPathwayId === pathwayId || !browser || $pathway.id === pathwayId) return;

    isFetching = true;
    pathway.set(defaultPathway);
    courses.set([]);

    const { data: _data } = await fetchPathway(pathwayId);

    if (_data) {
      setPathway(_data);
    }

    isFetching = false;
    prevPathwayId = pathwayId;
  }

  $: onPathwayIdChange(pathwayId);

  $: {
    const user = $group.people.find((person) => person.profile_id === $profile.id);
    if (user) {
      $globalStore.isStudent = user.role_id === 3;
    } else if (!$isOrgAdmin && $profile.id && $group.people.length) {
      // Current User doesn't have permission to view
      isPermitted = false;
    }
  }
</script>

<svelte:head>
  <title>{$pathway.title || 'ClassroomIO Pathway'}</title>
</svelte:head>

{#if isFetching}
  <Backdrop>
    <Moon size="60" color="#1d4ed8" unit="px" duration="1s" />
  </Backdrop>
{/if}

<Modal open={!isPermitted} width="w-96" modalHeading={$t('course.not_permitted.header')}>
  <div>
    <p class="dark:text-white text-md text-center">
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

<div class="root org-root">
  <PathwaySidebar {path} isStudent={$globalStore.isStudent} />
  <div class="{className} overflow-y-auto md:max-w-[70%] max-w-[95%] mx-auto rounded-md w-full">
    <!-- Show only if permitted -->
    {#if isPermitted}
      <slot />
    {/if}
  </div>
</div>

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
