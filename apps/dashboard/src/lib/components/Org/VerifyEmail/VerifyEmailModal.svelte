<script>
  import Modal from '$lib/components/Modal/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { profile } from '$lib/utils/store/user';
  import {
    triggerSendEmail,
    NOTIFICATION_NAME
  } from '$lib/utils/services/notification/notification';
  import { currentOrg } from '$lib/utils/store/org';
  let loading = false;
  let isSent = false;

  const resendVerificationCode = async () => {
    loading = true;
    const { email, id } = $profile;

    try {
      triggerSendEmail(NOTIFICATION_NAME.VERIFY_EMAIL, {
        to: email,
        profileId: id,
        orgSiteName: $currentOrg.siteName
      });
      isSent = true;
    } catch (error) {
      snackbar.error('error while sending code');
    } finally {
      loading = false;
      setTimeout(() => {
        isSent = false;
      }, 2000);
    }
  };
</script>

<Modal
  open={!$profile.is_email_verified}
  isCloseable={false}
  width="w-4/5 md:w-[35%]"
  containerClass="p-4"
>
  <div class="flex flex-col items-center space-y-6 text-center">
    <img src="/verify-email.svg" alt="email verification" />
    <p class="font-bold text-xl">Verify your Email</p>
    <p class="text-xs w-[70%] text-[#656565]">
      We've sent a verification email to {$profile.email} to confirm the validity of the email provided.
      Kindly verify your email to continue using ClassroomIO.
    </p>

    <PrimaryButton isDisabled={loading} className="font-normal" onClick={resendVerificationCode}>
      {#if loading}
        Loading...
      {:else if isSent}
        Code Sent!
      {:else}
        Resend Verification Code
      {/if}
    </PrimaryButton>
  </div>
</Modal>
