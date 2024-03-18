<script>
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import Audience from '$lib/components/Org/Audience/index.svelte';
  import { t } from '$lib/utils/functions/translations';

  let isLoading = false;
  function exportAudience() {
    isLoading = true;
    alert('This feature is coming soon');
    isLoading = false;
  }
</script>

<svelte:head>
  <title>Audience - ClassroomIO</title>
</svelte:head>

<section class="w-full max-w-6xl mx-auto">
  <div class="py-10 px-5">
    <div class="flex items-center justify-between mb-10">
      <h1 class="dark:text-white text-2xl md:text-3xl font-bold">{$t('audience.title')}</h1>
      <PrimaryButton
        label={$t('audience.export')}
        onClick={exportAudience}
        isDisabled={isLoading}
        {isLoading}
      />
    </div>

    <Audience />
  </div>
</section>
