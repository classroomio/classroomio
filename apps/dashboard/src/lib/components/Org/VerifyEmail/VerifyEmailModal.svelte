<script>
  {
  }
  import Modal from '$lib/components/Modal/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { profile } from '$lib/utils/store/user';
  import {
    triggerSendEmail,
    NOTIFICATION_NAME
  } from '$lib/utils/services/notification/notification';
  import { currentOrg } from '$lib/utils/store/org';

  const WAIT_SEC = 120;
  const WAIT_TIME = WAIT_SEC * 1000;

  let loading = false;
  let isSent = false;

  let interval;
  let countDown = WAIT_SEC;

  const resendVerificationCode = async () => {
    loading = true;

    try {
      triggerSendEmail(NOTIFICATION_NAME.VERIFY_EMAIL, {
        to: $profile.email,
        profileId: $profile.id,
        orgSiteName: $currentOrg.siteName
      });

      isSent = true;
    } catch (error) {
      snackbar.error('error while sending code');
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
</script>

<Modal
  open={!$profile.is_email_verified}
  isCloseable={false}
  width="w-4/5"
  maxWidth="w-[500px]"
  containerClass="p-4"
>
  <div class="flex flex-col items-center space-y-6 text-center">
    <img src="/verify-email.svg" alt="email verification" />
    <p class="font-bold text-xl">Verify your Email</p>
    <p class="text-sm w-[70%] text-gray-700">
      We've sent a verification email to {$profile.email} to confirm the validity of the email provided.
      Kindly verify your email to continue using ClassroomIO.
    </p>

    <div class="flex items-center flex-col">
      <PrimaryButton
        isDisabled={loading || isSent}
        className="font-normal"
        onClick={resendVerificationCode}
      >
        {#if loading}
          Loading...
        {:else}
          Resend Verification Code
        {/if}
      </PrimaryButton>
      {#if isSent}
        <p class="text-xs text-gray-700">Resend verification in {countDown} seconds</p>
      {/if}
    </div>
  </div>
</Modal>
