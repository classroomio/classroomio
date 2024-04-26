<script>
  import TeamMembers from '$lib/components/Org/Settings/TeamMembers.svelte';
  import { currentOrgPath } from '$lib/utils/store/org';
  import UpgradeBanner from '$lib/components/Upgrade/Banner.svelte';
  import { t } from '$lib/utils/functions/translations';
</script>

<svelte:head>
  <title>Teams - ClassroomIO</title>
</svelte:head>

<section class="w-full md:max-w-4xl mx-auto">
  <div class="py-10 px-3 md:px-5">
    <a class="text-gray-500 dark:text-white text-md" href={`${$currentOrgPath}/settings?tab=org`}
      >{$t('upgrade.back')}</a
    >
    <div class="flex items-center justify-between mb-10">
      <h1 class="dark:text-white text-3xl font-bold">{$t('upgrade.team_members')}</h1>
    </div>

    <UpgradeBanner>{$t('upgrade.team')}</UpgradeBanner>
    <TeamMembers />
  </div>
</section>
