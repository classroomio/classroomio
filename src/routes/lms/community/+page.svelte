<script>
  import { goto } from '$app/navigation';
  import Community from '$lib/components/Org/Community/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { currentOrgPath } from '$lib/utils/store/org';

  function askCommunity() {
    goto(`${$currentOrgPath}/community/ask`);
  }
</script>

<svelte:head>
  <title>Community - ClassroomIO</title>
</svelte:head>

<section class="w-full max-w-4xl mx-auto">
  <div class="py-10 px-5">
    <div class="flex items-center justify-between mb-10">
      <h1 class="dark:text-white text-3xl font-bold">Community</h1>
      <PrimaryButton label="Ask Community" onClick={askCommunity} />
    </div>

    <Community isLMS={true} />
  </div>
</section>
