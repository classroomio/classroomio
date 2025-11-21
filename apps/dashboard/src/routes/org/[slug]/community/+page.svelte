<script>
  import { goto } from '$app/navigation';
  import Community from '$lib/components/Org/Community/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { currentOrgPath } from '$lib/utils/store/org';
  import { isMobile } from '$lib/utils/store/useMobile';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import { t } from '$lib/utils/functions/translations';

  function askCommunity() {
    goto(`${$currentOrgPath}/community/ask`);
  }
</script>

<svelte:head>
  <title>Community - ClassroomIO</title>
</svelte:head>

<section class="w-full md:mx-auto md:max-w-6xl">
  <div class="w-full px-5 py-10">
    <div class="mb-10 flex w-full items-center justify-between">
      <h1 class="text-2xl md:text-3xl dark:text-white">{$t('community.title')}</h1>
      {#if $isMobile}
        <PrimaryButton onClick={askCommunity}>
          <PlusIcon size={16} />
        </PrimaryButton>
      {:else}
        <PrimaryButton label={$t('community.ask_button')} variant={VARIANTS.CONTAINED_DARK} onClick={askCommunity} />
      {/if}
    </div>
    <Community />
  </div>
</section>
