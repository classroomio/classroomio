<script>
  import { page } from '$app/stores';
  import AddOrgModal from '$lib/components/Org/AddOrgModal/AddOrgModal.svelte';
  import { isQuizPage } from '$lib/utils/functions/app';
  import OrgSideBar from '$lib/components/Org/SideBar.svelte';
  import VerifyEmailModal from '$lib/components/Org/VerifyEmail/VerifyEmailModal.svelte';
</script>

<AddOrgModal />
<VerifyEmailModal />
<div class="org-root w-full flex items-center justify-between">
  {#if !isQuizPage($page.url?.pathname)}
    <OrgSideBar />
  {/if}
  <div class="org-slot bg-white dark:bg-black w-full">
    <slot />
  </div>
</div>
