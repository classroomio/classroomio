<script lang="ts">
  import { globalStore } from '$lib/utils/store/app';

  import NewsSection from './components/NewsSection.svelte';
  import LogoutButton from './components/LogoutButton.svelte';
  import ProfileSection from './components/ProfileSection.svelte';
  // import FreeToolsSection from './components/FreeToolsSection.svelte';
  import CurrentOrgSection from './components/CurrentOrgSection.svelte';
</script>

<div class="cursor-pointer space-y-2 rounded-md px-2 py-2 md:px-4 md:py-4">
  <ProfileSection />

  {#if !$globalStore.isOrgSite}
    <CurrentOrgSection />
  {/if}

  <!-- <FreeToolsSection /> -->

  {#if !$globalStore.isOrgSite}
    <NewsSection />
  {/if}

  <LogoutButton />
</div>
