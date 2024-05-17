<script>
  import Domains from '$lib/components/Org/Settings/Domains.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrgPath } from '$lib/utils/store/org';
</script>

<svelte:head>
  <title>Custom domain - ClassroomIO</title>
</svelte:head>

<section class="w-full md:max-w-4xl mx-auto">
  <div class="py-10 px-3 md:px-5">
    <a class="text-gray-500 dark:text-white text-md" href={`${$currentOrgPath}/settings?tab=org`}
      >{$t('upgrade.back')}</a
    >
    <div class="flex items-center justify-between mb-10">
      <h1 class="dark:text-white text-3xl font-bold">{$t('components.settings.domains.title')}</h1>
    </div>

    <Domains />
  </div>
</section>
