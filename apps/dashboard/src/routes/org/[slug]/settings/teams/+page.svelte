<script>
  import TeamMembers from '$lib/components/Org/Settings/TeamMembers.svelte';
  import { currentOrgPath } from '$lib/utils/store/org';
  import UpgradeBanner from '$lib/components/Upgrade/Banner.svelte';
  import { t } from '$lib/utils/functions/translations';
</script>

<svelte:head>
  <title>Teams - ClassroomIO</title>
</svelte:head>

<section class="mx-auto w-full md:max-w-4xl">
  <div class="px-3 py-10 md:px-5">
    <a class="text-md text-gray-500 dark:text-white" href={`${$currentOrgPath}/settings?tab=org`}
      >{$t('upgrade.back')}</a
    >
    <div class="mb-10 flex items-center justify-between">
      <h1 class="text-3xl font-bold dark:text-white">{$t('upgrade.team_members')}</h1>
    </div>

    <UpgradeBanner>{$t('upgrade.team')}</UpgradeBanner>
    <TeamMembers />
  </div>
</section>
