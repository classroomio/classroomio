<script>
  import { goto } from '$app/navigation';
  import Community from '$lib/components/Org/Community/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { t } from '$lib/utils/functions/translations';

  function askCommunity() {
    goto(`/lms/community/ask`);
  }
</script>

<svelte:head>
  <title>Community - ClassroomIO</title>
</svelte:head>

<section class="mx-auto w-full max-w-4xl">
  <div class="px-5 py-10">
    <div class="mb-10 flex items-center justify-between">
      <h1 class="text-3xl font-bold dark:text-white">{$t('community.title')}</h1>
      <PrimaryButton label={$t('community.ask_button')} onClick={askCommunity} />
    </div>

    <Community isLMS={true} />
  </div>
</section>
