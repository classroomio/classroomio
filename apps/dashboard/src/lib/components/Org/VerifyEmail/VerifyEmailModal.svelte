<script>
  import Modal from '$lib/components/Modal/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { t } from '$lib/utils/functions/translations';
  import { NOTIFICATION_NAME, triggerSendEmail } from '$lib/utils/services/notification/notification';
  import { currentOrg } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';

  const WAIT_SEC = 120;
  const WAIT_TIME = WAIT_SEC * 1000;

  let loading = $state(false);
  let isSent = $state(false);
  let autoTriggered = $state(false);

  let interval;
  let countDown = $state(WAIT_SEC);

  const open = $derived(Boolean(!$profile.is_email_verified && !!$profile.id && !!$currentOrg.id));

  const sendVerificationCode = async () => {
    loading = true;

    try {
      triggerSendEmail(NOTIFICATION_NAME.VERIFY_EMAIL, {
        to: $profile.email,
        profileId: $profile.id,
        fullname: $profile.fullname,
        orgSiteName: $currentOrg.siteName
      });

      isSent = true;
    } catch (error) {
      snackbar.error('verify_email_modal.snackbar.error');
    } finally {
      loading = false;
    }

    interval = setInterval(() => {
      countDown = countDown - 1;
    }, 1000);

    setTimeout(() => {
      isSent = false;

      clearInterval(interval);
    }, WAIT_TIME);
  };

  $effect(() => {
    if (!open || isSent || loading || autoTriggered) return;

    // Only send verification code on load once
    autoTriggered = true;
    sendVerificationCode();
  });
</script>

<Modal {open} isCloseable={false} width="w-4/5" maxWidth="w-[500px]" containerClass="p-4">
  <div class="flex flex-col items-center space-y-6 text-center">
    <img src="/verify-email.svg" alt="email verification" />
    <p class="text-xl font-bold">{$t('verify_email_modal.heading')}</p>
    <p class="w-[70%] text-sm text-gray-700 dark:text-gray-200">
      {$t('verify_email_modal.sent_verification')}
      {$profile.email}
      {$t('verify_email_modal.to_confirm')}
    </p>

    <div class="flex flex-col items-center">
      <PrimaryButton isDisabled={loading || isSent} className="font-normal" onClick={sendVerificationCode}>
        {#if loading}
          {$t('verify_email_modal.loading')}
        {:else}
          {$t('verify_email_modal.resend')}
        {/if}
      </PrimaryButton>
      {#if isSent}
        <p class="text-xs text-gray-700">
          {$t('verify_email_modal.resend_in')}
          {countDown}
          {$t('verify_email_modal.seconds')}
        </p>
      {/if}
    </div>
  </div>
</Modal>
