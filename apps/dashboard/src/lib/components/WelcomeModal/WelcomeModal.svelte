<script>
  import Modal from '../Modal/index.svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { currentOrgPath } from '$lib/utils/store/org';
  import { triggerSendEmail, NOTIFICATION_NAME } from '$lib/utils/services/notification/notification';
  import { profile } from '$lib/utils/store/user';

  let query = new URLSearchParams(page.url.search);
  let welcomePopup = query.get('welcomePopup');
  import { t } from '$lib/utils/functions/translations';

  const closeModal = () => {
    triggerSendEmail(NOTIFICATION_NAME.WELCOME_TO_APP, {
      to: $profile.email,
      name: $profile.fullname
    });

    goto($currentOrgPath + '/courses?create=true');
  };
</script>

<Modal onClose={closeModal} open={welcomePopup === 'true'} width="w-9/12" maxWidth="w-[800px]" modalHeading="Welcome">
  <p class="text-sm text-black md:text-base lg:text-lg dark:text-white">
    {$t('welcome_modal.we_at')}
    <a href="https://app.classroomio.com/" class="text-primary-700 no-underline hover:no-underline">ClassroomIO</a>
    {$t('welcome_modal.small_team')}
    <span class="text-primary-700">{$t('welcome_modal.thank_you')};</span>
    {$t('welcome_modal.deeply_appreciate')}
  </p>
  <img src="/images/welcome-img.svg" alt="A welcome banner" class="my-6 w-full" />
</Modal>
