<script>
  import { goto } from '$app/navigation';
  import { CommunityPage } from '$lib/features/community/pages';
  import { Button } from '@cio/ui/base/button';
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
      <h1 class="text-3xl dark:text-white">{$t('community.title')}</h1>
      <Button onclick={askCommunity}>
        {$t('community.ask_button')}
      </Button>
    </div>

    <CommunityPage isLMS={true} />
  </div>
</section>
