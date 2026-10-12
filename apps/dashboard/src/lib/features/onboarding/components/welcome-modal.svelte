<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import RocketIcon from '@lucide/svelte/icons/rocket';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { Confetti } from '$features/ui';
  import { setConfetti } from '$features/ui/confetti/store';
  import { earlyAdopterClaimApi } from '$features/early-adopter-claim/api/early-adopter-claim.svelte';
  import { currentOrgPath } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { t } from '$lib/utils/functions/translations';

  const isWelcomeRequested = $derived(
    page.url.searchParams.get('welcomePopup') === 'true' && !!$profile.isEmailVerified
  );
  const isPlanClaimed = $derived(earlyAdopterClaimApi.status === 'claimed');
  const isClaimPending = $derived(earlyAdopterClaimApi.status === 'pending');
  const open = $derived(!isClaimPending && (isPlanClaimed || isWelcomeRequested));

  $effect(() => {
    if (!isPlanClaimed) return;

    setConfetti(true);
    const hideConfetti = setTimeout(() => setConfetti(false), 1500);

    return () => clearTimeout(hideConfetti);
  });

  function closeModal() {
    earlyAdopterClaimApi.acknowledge();

    if (page.url.searchParams.get('welcomePopup') === 'true') {
      goto(resolve(`${$currentOrgPath}/courses?create=true`, {}));
    }
  }
</script>

{#if isPlanClaimed}
  <Confetti />
{/if}

<Dialog.Root
  {open}
  onOpenChange={(isOpen) => {
    if (!isOpen) closeModal();
  }}
>
  <Dialog.Content class="w-[700px]! max-w-none!">
    {#if isPlanClaimed}
      <Dialog.Header>
        <Dialog.Title>{$t('early_adopter_claim.success.title')}</Dialog.Title>
      </Dialog.Header>
      <div class="flex w-full flex-col items-center justify-center gap-4 px-1 text-center">
        <RocketIcon class="my-3 size-6" color="var(--primary)" />
        <p class="text-lg">{$t('pricing.modal.thanks')}</p>
        <p class="mb-4">{$t('early_adopter_claim.success.body')}</p>
        <Button class="w-full sm:w-auto" onclick={closeModal}>{$t('early_adopter_claim.success.continue')}</Button>
      </div>
    {:else}
      <Dialog.Header>
        <Dialog.Title>Welcome</Dialog.Title>
      </Dialog.Header>
      <p class="text-md text-black dark:text-white">
        {$t('welcome_modal.we_at')}
        <a href="https://app.classroomio.com/" class="ui:text-primary no-underline hover:no-underline">ClassroomIO</a>
        {$t('welcome_modal.small_team')}
        <span class="ui:text-primary">{$t('welcome_modal.thank_you')};</span>
        {$t('welcome_modal.deeply_appreciate')}
      </p>
      <img src="/images/welcome-img.svg" alt="A welcome banner" class="my-6 w-full" />
    {/if}
  </Dialog.Content>
</Dialog.Root>
