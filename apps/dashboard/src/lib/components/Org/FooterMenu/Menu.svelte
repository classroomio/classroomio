<script lang="ts">
  import { globalStore } from '$lib/utils/store/app';

  import NewsSection from './components/NewsSection.svelte';
  import LogoutButton from './components/LogoutButton.svelte';
</script>

<div class="cursor-pointer space-y-2">
  {#if !$globalStore.isOrgSite}
    <NewsSection />
  {/if}

  <LogoutButton />
</div>
