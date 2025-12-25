<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { t } from '$lib/utils/functions/translations';
  import { Button } from '@cio/ui/base/button';
  import { Empty } from '@cio/ui/custom/empty';
  import OctagonAlertIcon from '@lucide/svelte/icons/octagon-alert';
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';

  let type = $derived($page.url.searchParams.get('error') || 'unknown');

  let { message, title } = $derived.by(() => {
    const fields = {
      title: '',
      message: ''
    };
    if (!type) return fields;

    switch (type) {
      case 'token_expired':
        fields.title = $t('email_verification.errors.token_expired.title');
        fields.message = $t('email_verification.errors.token_expired.message');
        break;
      case 'email_mismatch':
        fields.title = $t('email_verification.errors.email_mismatch.title');
        fields.message = $t('email_verification.errors.email_mismatch.message');
        break;
      case 'legacy_method_blocked':
        fields.title = $t('email_verification.errors.legacy_blocked.title');
        fields.message = $t('email_verification.errors.legacy_blocked.message');
        break;
      case 'database_error':
        fields.title = $t('email_verification.errors.database.title');
        fields.message = $t('email_verification.errors.database.message');
        break;
      default:
        fields.title = $t('email_verification.errors.unknown.title');
        fields.message = $t('email_verification.errors.unknown.message');
    }

    return fields;
  });

  function handleSupport() {
    window.open('mailto:help@classroomio.com?subject=Email Verification Issue&body=Error Type: ' + type, '_blank');
  }
</script>

<svelte:head>
  <title>Email Verification Error - ClassroomIO</title>
  <meta name="description" content="There was an issue verifying your email address." />
</svelte:head>

<Empty
  {title}
  description={message}
  icon={OctagonAlertIcon}
  variant="page"
  layout="full-page"
  showLogo={true}
  class="h-fit! flex-none! max-h-none!"
>
  {#if type === 'legacy_method_blocked'}
    <div class="rounded-md border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
      <div class="flex items-center">
        <TriangleAlertIcon class="h-5 w-5 flex-shrink-0 text-yellow-400" />
        <div class="ml-3">
          <h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            {$t('email_verification.security_notice.title')}
          </h3>
          <p class="mt-1 text-xs text-yellow-700 dark:text-yellow-300">
            {$t('email_verification.security_notice.message')}
          </p>
        </div>
      </div>
    </div>
  {/if}
  <div class="lex w-full flex-col justify-center gap-4 md:flex-row">
    <Button onclick={handleSupport} variant="ghost">
      {$t('email_verification.actions.contact_support')}
    </Button>
    <Button onclick={() => goto('/')}>
      {$t('email_verification.actions.back_to_dashboard')}
    </Button>
  </div>
</Empty>
