<script>
  import TeamMembers from '../../../../components/Org/Settings/TeamMembers.svelte';
  import { currentOrgPath } from '../../../../utils/store/org';
</script>

<svelte:head>
  <title>Teams - ClassroomIO</title>
</svelte:head>

<section class="w-full max-w-6xl mx-auto">
  <div class="py-10 px-5">
    <a
      class="text-gray-500 dark:text-gray-200 text-md"
      href={`${$currentOrgPath}/settings`}>Back to Settings</a
    >
    <div class="flex items-center justify-between mb-10">
      <h1 class="dark:text-white text-3xl font-bold">Team members</h1>
    </div>

    <TeamMembers />
  </div>
</section>
