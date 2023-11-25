<script>
  import OrgSettings from '$lib/components/Org/Settings/index.svelte';
  import ViewSiteBtn from '$lib/components/Buttons/VisitOrgSite.svelte';
</script>

<svelte:head>
  <title>Settings - ClassroomIO</title>
</svelte:head>

<section class="w-full max-w-6xl mx-auto">
  <div class="py-10 px-5">
    <div class="flex items-center justify-between mb-10">
      <h1 class="dark:text-white text-3xl font-bold">Settings</h1>

      <ViewSiteBtn />
    </div>

    <OrgSettings />
  </div>
</section>
