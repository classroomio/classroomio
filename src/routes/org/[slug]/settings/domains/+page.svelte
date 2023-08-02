<script>
  import Domains from '$lib/components/Org/Settings/Domains.svelte';
  import { currentOrgPath } from '$lib/utils/store/org';
</script>

<svelte:head>
  <title>Custom domain - ClassroomIO</title>
</svelte:head>

<section class="w-full max-w-6xl mx-auto">
  <div class="py-10 px-5">
    <a
      class="text-gray-500 dark:text-white text-md"
      href={`${$currentOrgPath}/settings`}>Back to Settings</a
    >
    <div class="flex items-center justify-between mb-10">
      <h1 class="dark:text-white text-3xl font-bold">Custom domain</h1>
    </div>

    <Domains />
  </div>
</section>
