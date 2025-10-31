<script>
  import Modal from '$lib/components/Modal/index.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { user } from '$lib/utils/store/user';

  let open = false;

  // Open modal when user has a new_email pending confirmation
  $: open = Boolean($user.currentSession?.new_email);
</script>

<Modal {open} isCloseable={false} width="w-4/5" maxWidth="w-[500px]" containerClass="p-4">
  <div class="flex flex-col items-center space-y-6 text-center">
    <img src="/verify-email.svg" alt="email verification" />
    <p class="text-xl font-bold">{$t('verify_new_email_modal.heading')}</p>
    <p class="w-[70%] text-sm text-gray-700 dark:text-gray-200">
      {$t('verify_new_email_modal.sent_verification')}
      <span class="font-semibold">{$user.currentSession?.new_email}</span>
      {$t('verify_new_email_modal.to_confirm')}
    </p>

    <div class="flex flex-col items-center space-y-2">
      <p class="text-xs text-gray-600 dark:text-gray-400">
        {$t('verify_new_email_modal.no_email')}
      </p>
      <a
        href="mailto:classroomio@support.com"
        class="text-primary-600 hover:text-primary-700 dark:text-primary-400 text-sm hover:underline"
      >
        classroomio@support.com
      </a>
    </div>
  </div>
</Modal>
