<script>
  import TeamMembers from '../../../../components/Org/Settings/TeamMembers.svelte';
  import { currentOrg } from '../../../../utils/store/org';
</script>

<svelte:head>
  <title>Teams - ClassroomIO</title>
</svelte:head>

<section class="w-full max-w-6xl mx-auto">
  <div class="py-10 px-5">
    <a
      class="text-gray-500 text-md"
      href={`/org/${$currentOrg.siteName}/settings`}>Back to Settings</a
    >
    <div class="flex items-center justify-between mb-10">
      <h1 class="text-3xl font-bold">Team members</h1>
    </div>

    <TeamMembers />
  </div>
</section>
