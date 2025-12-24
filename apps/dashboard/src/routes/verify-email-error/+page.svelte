<script>
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';

  let errorType = '';
  let errorMessage = '';
  let errorTitle = '';
  let showRetry = false;

  onMount(() => {
    errorType = $page.url.searchParams.get('error') || 'unknown';

    switch (errorType) {
      case 'invalid_token':
        errorTitle = $t('email_verification.errors.invalid_token.title');
        errorMessage = $t('email_verification.errors.invalid_token.message');
        showRetry = true;
        break;
      case 'token_already_used':
        errorTitle = $t('email_verification.errors.token_used.title');
        errorMessage = $t('email_verification.errors.token_used.message');
        showRetry = true;
        break;
      case 'token_expired':
        errorTitle = $t('email_verification.errors.token_expired.title');
        errorMessage = $t('email_verification.errors.token_expired.message');
        showRetry = true;
        break;
      case 'email_mismatch':
        errorTitle = $t('email_verification.errors.email_mismatch.title');
        errorMessage = $t('email_verification.errors.email_mismatch.message');
        showRetry = true;
        break;
      case 'legacy_method_blocked':
        errorTitle = $t('email_verification.errors.legacy_blocked.title');
        errorMessage = $t('email_verification.errors.legacy_blocked.message');
        showRetry = true;
        break;
      case 'database_error':
        errorTitle = $t('email_verification.errors.database.title');
        errorMessage = $t('email_verification.errors.database.message');
        showRetry = false;
        break;
      default:
        errorTitle = $t('email_verification.errors.unknown.title');
        errorMessage = $t('email_verification.errors.unknown.message');
        showRetry = true;
    }
  });

  function handleRetry() {
    goto('/dashboard');
  }

  function handleSupport() {
    window.open(
      'mailto:help@classroomio.com?subject=Email Verification Issue&body=Error Type: ' + errorType,
      '_blank'
    );
  }
</script>

<svelte:head>
  <title>Email Verification Error - ClassroomIO</title>
  <meta name="description" content="There was an issue verifying your email address." />
</svelte:head>

<div
  class="flex min-h-screen w-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8 dark:bg-gray-900"
>
  <div class="w-full max-w-md space-y-8">
    <div class="text-center">
      <!-- Error Icon -->
      <svg
        class="mx-auto h-12 w-12 text-red-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>

      <h2 class="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
        {errorTitle}
      </h2>

      <p class="mt-4 text-sm text-gray-600 dark:text-gray-400">
        {errorMessage}
      </p>

      {#if errorType === 'legacy_method_blocked'}
        <div
          class="mt-4 rounded-md border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20"
        >
          <div class="flex">
            <svg
              class="h-5 w-5 flex-shrink-0 text-yellow-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                {$t('email_verification.security_notice.title')}
              </h3>
              <p class="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                {$t('email_verification.security_notice.message')}
              </p>
            </div>
          </div>
        </div>
      {/if}
    </div>

    <div class="mt-8 flex w-full flex-col justify-center gap-4 md:flex-row">
      <PrimaryButton
        onClick={handleSupport}
        variant={VARIANTS.OUTLINED}
        label={$t('email_verification.actions.contact_support')}
      />
      <PrimaryButton
        onClick={() => goto('/')}
        variant={VARIANTS.OUTLINED}
        label={$t('email_verification.actions.back_to_dashboard')}
      />
    </div>

    <!-- Security Information -->
    <div class="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
      <p>{$t('email_verification.security_footer')}</p>
    </div>
  </div>
</div>
