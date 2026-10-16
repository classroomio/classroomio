<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { Button } from '@cio/ui/base/button';
  import { AuthUI } from '$features/ui';
  import { currentOrg } from '$lib/utils/store/org';
  import { setTheme } from '$lib/utils/functions/theme';
  import { learnerPathStore } from '$features/learning-path/api/learning-path.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { profile } from '$lib/utils/store/user';
  import { snackbar } from '$features/ui/snackbar/store';
  import { capturePosthogEvent } from '$lib/utils/services/posthog';
  import { resolve } from '$app/paths';
  import { authClient } from '$lib/utils/services/auth/client';
  import { appInitApi } from '$features/app/init.svelte';

  let { data } = $props();

  let loading = $state(false);
  let enrollmentInFlight = $state(false);
  let enrollmentSucceeded = $state(false);
  let verificationEmailSent = $state(false);
  let enrolledPendingVerification = $state(false);
  let enrollmentError = $state<string | null>(null);

  const session = authClient.useSession();
  const sessionReady = $derived(!$session.isPending && !$session.isRefetching);
  const sessionUser = $derived($session.data?.user ?? null);
  const isLoggedIn = $derived(sessionReady && Boolean(sessionUser));
  const isEmailVerified = $derived(Boolean($profile.isEmailVerified || sessionUser?.emailVerified));

  async function sendVerificationEmail() {
    const email = $profile.email || sessionUser?.email;
    if (!email) {
      snackbar.error('verify_email_modal.snackbar.error');
      return;
    }

    try {
      const callbackURL = new URL(page.url.href);
      callbackURL.searchParams.set('trigger', 'app');

      await authClient.sendVerificationEmail({
        email,
        callbackURL: callbackURL.toString()
      });
    } catch {
      snackbar.error('verify_email_modal.snackbar.error');
    }
  }

  const canJoinPath = $derived(
    data.requiresPaymentOrInvite
      ? false
      : data.path?.allowSelfEnrollment !== false && data.path?.status === 'ACTIVE' && Boolean(data.path?.isPublished)
  );
  const isPreparingEnrollment = $derived(
    isLoggedIn &&
      canJoinPath &&
      !enrollmentSucceeded &&
      !enrolledPendingVerification &&
      !appInitApi.isInitializedAndReady
  );
  const joinButtonLoading = $derived(!sessionReady || loading || enrollmentInFlight || isPreparingEnrollment);

  function getBlockedMessage(): string {
    if (data.requiresPaymentOrInvite) {
      return t.get('course.navItem.landing_page.enroll_page.requires_payment_or_invite');
    }
    if (data.path?.allowSelfEnrollment === false) {
      return t.get('course.navItem.landing_page.pricing_section.not_accepting');
    }
    if (data.path?.status !== 'ACTIVE' || !data.path?.isPublished) {
      return t.get('public_learning_paths.detail.unavailable');
    }
    return '';
  }

  async function completeEnrollment() {
    if (!data.path?.id || enrollmentInFlight || enrollmentSucceeded) {
      return;
    }

    enrollmentInFlight = true;
    loading = true;
    enrollmentError = null;

    let navigatingAway = false;

    try {
      const result = await learnerPathStore.enrollFromPublicPage(data.path.id);

      if (!result.enrolled) {
        enrollmentError = result.error || t.get('snackbar.invite.failed_join');
        return;
      }

      enrollmentSucceeded = true;

      const studentId = $profile.id || sessionUser?.id || '';
      const studentEmail = $profile.email || sessionUser?.email || '';

      capturePosthogEvent('student_joined_learning_path', {
        path_name: data.path?.name,
        student_id: studentId,
        student_email: studentEmail
      });

      if (!isEmailVerified) {
        enrolledPendingVerification = true;

        if (!verificationEmailSent) {
          verificationEmailSent = true;
          void sendVerificationEmail();
        }

        return;
      }

      navigatingAway = true;
      await goto(resolve(`/lms/paths/${data.path.publicId}`, {}));
    } catch (error) {
      console.error('[path enroll] unexpected error during enrollment:', error);
      enrollmentError = t.get('snackbar.invite.failed_join');
      snackbar.error('snackbar.invite.failed_join');
    } finally {
      enrollmentInFlight = false;
      if (!navigatingAway) {
        loading = false;
      }
    }
  }

  async function handleSubmit() {
    if (!canJoinPath) {
      snackbar.error(getBlockedMessage());
      return;
    }

    if (!sessionReady) {
      return;
    }

    if (isLoggedIn) {
      await completeEnrollment();
      return;
    }

    loading = true;

    const redirectPath = page.url?.pathname ?? `/learning-paths/${data.path?.slug ?? ''}/enroll`;
    const redirectUrl = redirectPath;
    const target = '/signup';
    const params = new URLSearchParams({ redirect: redirectUrl });

    goto(resolve(`${target}?${params.toString()}`, {}));
    loading = false;
  }

  $effect(() => {
    if (
      !sessionReady ||
      !isLoggedIn ||
      !canJoinPath ||
      enrollmentInFlight ||
      loading ||
      enrollmentSucceeded ||
      enrollmentError
    ) {
      return;
    }

    if (!appInitApi.isInitializedAndReady) {
      return;
    }

    void completeEnrollment();
  });

  $effect(() => {
    if (!data.currentOrg) return;

    const rawTheme = data.currentOrg.theme;
    const themeString = typeof rawTheme === 'string' ? rawTheme : '';

    setTheme(themeString);
    currentOrg.update((organization) => ({
      ...organization,
      id: data.currentOrg?.id ?? organization.id,
      name: data.currentOrg?.name ?? organization.name,
      siteName: data.currentOrg?.siteName ?? organization.siteName,
      theme: themeString || organization.theme
    }));
  });
</script>

<svelte:head>
  <title>Join {data.path?.name ?? 'Learning Path'} on ClassroomIO</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<AuthUI isLogin={false} {handleSubmit} isLoading={joinButtonLoading} showOnlyContent={true} showLogo={true}>
  <div class="mt-0 w-full">
    <h3 class="mt-0 mb-4 text-center text-lg font-medium dark:text-white">{data.path?.name}</h3>
    <p class="text-center text-sm font-light dark:text-white">{data.path?.description}</p>
    {#if enrolledPendingVerification}
      <p class="ui:text-primary mt-3 text-center text-sm font-medium">
        {$t('course.navItem.landing_page.enroll_page.enrolled_success')}
      </p>
      <p class="ui:text-muted-foreground mt-2 text-center text-sm">
        {$t('course.navItem.landing_page.enroll_page.enrolled_verify_email')}
      </p>
      <div class="mt-4 flex justify-center">
        <Button type="button" variant="outline" onclick={sendVerificationEmail}>
          {$t('verify_email_modal.resend')}
        </Button>
      </div>
    {:else if data.requiresPaymentOrInvite}
      <p class="ui:text-muted-foreground mt-3 text-center text-sm">
        {$t('course.navItem.landing_page.enroll_page.requires_payment_or_invite')}
      </p>
      <a
        href={resolve(`/learning-paths/${data.path?.slug ?? ''}`, {})}
        class="ui:text-primary mt-3 block text-center text-sm underline"
      >
        {$t('public_learning_paths.detail.back_to_path')}
      </a>
    {:else if enrollmentError}
      <p class="mt-3 text-center text-sm text-red-500">{enrollmentError}</p>
    {:else if !canJoinPath}
      <p class="mt-3 text-center text-sm text-red-500">{getBlockedMessage()}</p>
    {/if}
  </div>

  {#if !enrolledPendingVerification}
    <div class="my-4 flex w-full items-center justify-center">
      <Button type="submit" disabled={!canJoinPath || joinButtonLoading} loading={joinButtonLoading}>
        {$t('learningPath.detail.enroll')}
      </Button>
    </div>
  {/if}
</AuthUI>
