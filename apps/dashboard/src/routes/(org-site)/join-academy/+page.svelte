<script lang="ts">
  import { page } from '$app/state';
  import { onMount } from 'svelte';

  import { orgApi } from '$features/org/api/org.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg } from '$lib/utils/store/org';
  import { Button } from '@cio/ui/base/button';
  import { Spinner } from '@cio/ui/base/spinner';

  let hasFailed = $state(false);

  async function joinAcademy() {
    const orgId = $currentOrg.id;
    if (!orgId) {
      hasFailed = true;
      return;
    }

    hasFailed = false;
    const redirectTo = page.url.searchParams.get('redirect') || '/lms';
    const result = await orgApi.joinAcademy(orgId, redirectTo);
    if (!result) {
      hasFailed = true;
    }
  }

  onMount(() => {
    void joinAcademy();
  });
</script>

<main class="flex min-h-screen items-center justify-center p-6">
  {#if hasFailed}
    <div class="flex max-w-md flex-col items-center gap-4 text-center">
      <p class="ui:text-destructive">{$t('invite.organization.messages.join_failed')}</p>
      <div class="flex gap-3">
        <Button variant="secondary" href="/">{$t('navigation.home')}</Button>
        <Button onclick={joinAcademy}>{$t('invite.organization.messages.try_again')}</Button>
      </div>
    </div>
  {:else}
    <div class="flex flex-col items-center gap-4 text-center">
      <Spinner class="size-10!" />
      <p class="ui:text-muted-foreground">{$t('navigation.loading_state')}</p>
    </div>
  {/if}
</main>
