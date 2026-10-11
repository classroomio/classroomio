<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { Button } from '@cio/ui/base/button';
  import { AuthUI } from '$features/ui';
  import RocketIcon from '@lucide/svelte/icons/rocket';
  import { storeClaimToken } from '$features/early-adopter-claim/utils/claim-utils';
  import { t } from '$lib/utils/functions/translations';
  import { profile } from '$lib/utils/store/user';

  function continueToAcademy() {
    window.location.href = '/';
  }

  onMount(() => {
    storeClaimToken(page.params.token ?? '');
  });
</script>

<AuthUI isLogin={false} showOnlyContent={true} showLogo={true}>
  <div class="flex w-full flex-col items-center gap-4 text-center">
    <RocketIcon class="size-8" color="var(--primary)" />
    <h1 class="text-2xl font-semibold text-balance">{$t('early_adopter_claim.page.title')}</h1>
    <p class="text-sm text-pretty">{$t('early_adopter_claim.page.body')}</p>

    {#if $profile.id}
      <Button class="w-full" onclick={continueToAcademy}>{$t('early_adopter_claim.page.continue')}</Button>
    {:else}
      <div class="flex w-full flex-col gap-3">
        <Button class="w-full" href="/signup">{$t('early_adopter_claim.page.sign_up')}</Button>
        <Button class="w-full" variant="outline" href="/login">{$t('early_adopter_claim.page.log_in')}</Button>
      </div>
    {/if}
  </div>
</AuthUI>
