<script>
  import Domains from '$lib/components/Org/Settings/Domains.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrgPath } from '$lib/utils/store/org';
</script>

<svelte:head>
  <title>Custom domain - ClassroomIO</title>
</svelte:head>

<section class="mx-auto w-full md:max-w-4xl">
  <div class="px-3 py-10 md:px-5">
    <a class="text-md text-gray-500 dark:text-white" href={`${$currentOrgPath}/settings?tab=org`}
      >{$t('upgrade.back')}</a
    >
    <div class="mb-10 flex items-center justify-between">
      <h1 class="text-3xl dark:text-white">{$t('components.settings.domains.title')}</h1>
    </div>

    <Domains />
  </div>
</section>
