<script>
  import { Modal } from '$lib/components/Modal';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { currentOrgPath } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { t } from '$lib/utils/functions/translations';
  import { classroomio } from '$lib/utils/services/api';

  let query = new URLSearchParams(page.url.search);
  let welcomePopup = query.get('welcomePopup');
  let open = $derived(welcomePopup === 'true' && !!$profile.isEmailVerified);

  let isLoading = $state(false);

  const closeModal = async () => {
    if (isLoading) return;

    try {
      isLoading = true;
      await classroomio.onboarding.complete.$post({});

      goto($currentOrgPath + '/courses?create=true');
    } catch (error) {
      console.error(error);
    }
  };
</script>

<Modal onClose={closeModal} isClosing={isLoading} {open} width="w-9/12" maxWidth="w-[800px]" modalHeading="Welcome">
  <p class="text-sm text-black md:text-base lg:text-lg dark:text-white">
    {$t('welcome_modal.we_at')}
    <a href="https://app.classroomio.com/" class="text-primary-700 no-underline hover:no-underline">ClassroomIO</a>
    {$t('welcome_modal.small_team')}
    <span class="text-primary-700">{$t('welcome_modal.thank_you')};</span>
    {$t('welcome_modal.deeply_appreciate')}
  </p>
  <img src="/images/welcome-img.svg" alt="A welcome banner" class="my-6 w-full" />
</Modal>
