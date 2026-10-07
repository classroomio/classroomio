<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { Button } from '@cio/ui/base/button';
  import RocketIcon from '@lucide/svelte/icons/rocket';
  import { storeClaimToken } from '$features/early-adopter-claim/utils/claim-utils';
  import { t } from '$lib/utils/functions/translations';
  import { profile } from '$lib/utils/store/user';

  onMount(() => {
    storeClaimToken(page.params.token ?? '');
  });
</script>

<div class="flex min-h-screen items-center justify-center px-4 py-10">
  <div class="flex w-full max-w-md flex-col items-center gap-5 text-center">
    <RocketIcon class="size-8" color="var(--primary)" />
    <h1 class="text-2xl font-semibold text-balance">{$t('early_adopter_claim.page.title')}</h1>
    <p class="text-pretty">{$t('early_adopter_claim.page.body')}</p>

    {#if $profile.id}
      <Button class="w-full sm:w-auto" href="/">{$t('early_adopter_claim.page.continue')}</Button>
    {:else}
      <div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Button class="w-full sm:w-auto" href="/signup">{$t('early_adopter_claim.page.sign_up')}</Button>
        <Button class="w-full sm:w-auto" variant="outline" href="/login">{$t('early_adopter_claim.page.log_in')}</Button
        >
      </div>
    {/if}
  </div>
</div>
