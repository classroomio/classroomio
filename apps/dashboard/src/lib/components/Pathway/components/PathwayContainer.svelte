<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { Moon } from 'svelte-loading-spinners';

  import {
    defaultPathway,
    group,
    pathway,
    pathwayCourses,
    setPathway
  } from '$lib/components/Pathway/store';
  import { t } from '$lib/utils/functions/translations';
  import { fetchPathway } from '$lib/utils/services/pathways';
  import { globalStore } from '$lib/utils/store/app';
  import { isOrgAdmin } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';

  import Backdrop from '$lib/components/Backdrop/index.svelte';
  import Confetti from '$lib/components/Confetti/index.svelte';
  import Modal from '$lib/components/Modal/index.svelte';
  import PathwaySidebar from '$lib/components/Pathway/components/Sidebar.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';

  export let pathwayId = '';
  export let path = '';
  export let className: string = '';
  export let isFetching = false;
  export let isLandingPage = false;

  let prevPathwayId = '';
  let isPermitted = true;

  async function onPathwayIdChange(pathwayId = '') {
    if (!pathwayId || prevPathwayId === pathwayId || !browser || $pathway.id === pathwayId) return;

    isFetching = true;
    pathway.set(defaultPathway);
    pathwayCourses.set([]);

    const { data: _data } = await fetchPathway(pathwayId);

    console.log('dataaaa refetch', _data);

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

<Modal
  open={!isPermitted}
  width="w-96"
  modalHeading={$t('pathway.components.not_permitted.header')}
>
  <div>
    <p class="text-md text-center dark:text-white">
      {$t('pathway.components.not_permitted.body')}
    </p>

    <div class="mt-5 flex justify-center">
      <PrimaryButton
        className="px-6 py-3"
        label={$t('pathway.components.not_permitted.button')}
        onClick={() => {
          goto('/org/*');
        }}
      />
    </div>
  </div>
</Modal>

<div class="root org-root">
  <PathwaySidebar {path} isStudent={$globalStore.isStudent} />
  <div class="{className} mx-auto w-full max-w-[95%] overflow-y-auto rounded-md">
    {#if isLandingPage}
      <Confetti />
    {/if}

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
