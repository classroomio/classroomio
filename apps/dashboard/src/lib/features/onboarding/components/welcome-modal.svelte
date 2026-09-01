<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { currentOrgPath } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { t } from '$lib/utils/functions/translations';
  import { classroomio } from '$lib/utils/services/api';

  const open = $derived(page.url.searchParams.get('welcomePopup') === 'true' && !!$profile.isEmailVerified);

  let completionTriggered = $state(false);
  let isCompleting = $state(false);

  async function completeOnboarding() {
    if (isCompleting) return;

    try {
      isCompleting = true;
      const response = await classroomio.onboarding.complete.$post({});

      if (!response.ok) {
        throw new Error('Failed to complete onboarding');
      }
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    } finally {
      isCompleting = false;
    }
  }

  function closeModal() {
    if (isCompleting) return;

    goto(resolve(`${$currentOrgPath}/courses?create=true`, {}));
  }

  $effect(() => {
    if (!open || completionTriggered) return;

    completionTriggered = true;
    void completeOnboarding();
  });
</script>

<Dialog.Root
  {open}
  onOpenChange={(isOpen) => {
    if (!isOpen) closeModal();
  }}
>
  <Dialog.Content class="w-[700px]! max-w-none!">
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
  </Dialog.Content>
</Dialog.Root>
