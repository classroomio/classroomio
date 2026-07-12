<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { Button } from '@cio/ui/base/button';
  import { AuthUI } from '$features/ui';
  import { currentOrg } from '$lib/utils/store/org';
  import { setTheme } from '$lib/utils/functions/theme';
  import { courseApi } from '$features/course/api';
  import { t } from '$lib/utils/functions/translations';
  import { profile } from '$lib/utils/store/user';
  import { snackbar } from '$features/ui/snackbar/store';
  import { capturePosthogEvent } from '$lib/utils/services/posthog';
  import { resolve } from '$app/paths';
  import { authClient } from '$lib/utils/services/auth/client';
  import { appInitApi } from '$features/app/init.svelte';
  import { getStudentCourseContinuePath } from '$features/course/utils/student-course-navigation';

  let { data } = $props();

  let loading = $state(false);
  let enrollmentInFlight = $state(false);
  let enrollmentSucceeded = $state(false);
  let verificationEmailSent = $state(false);
  let enrolledPendingVerification = $state(false);

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

  const inviteStatus = $derived(data.invite?.status ?? 'INVALID');
  const hasActiveInvite = $derived(Boolean(data.invite) && inviteStatus === 'ACTIVE');
  // The org-wide cap only applies to *new* students joining the org. We can't
  // know the viewer's membership here (public, unauthenticated load), so only
  // pre-block anonymous visitors (would-be new joiners). Logged-in users are
  // governed by the membership-aware backend, which allows existing members
  // and returns UPGRADE_REQUIRED (surfaced via the enroll onError) for new ones.
  const blocksNewSignup = $derived(Boolean(data.studentLimitReached) && !isLoggedIn);
  const canJoinCourse = $derived(
    data.requiresPaymentOrInvite || blocksNewSignup
      ? false
      : (hasActiveInvite || (!data.invite && data.course?.allowNewStudent !== false)) &&
          data.course?.status === 'ACTIVE' &&
          Boolean(data.course?.isPublished)
  );

  function getBlockedMessage(): string {
    if (blocksNewSignup) {
      return t.get('course.navItem.landing_page.enroll_page.student_limit_reached', {
        orgName: data.currentOrg?.name ?? ''
      });
    }
    if (data.requiresPaymentOrInvite) {
      return t.get('course.navItem.landing_page.enroll_page.requires_payment_or_invite');
    }
    if (data.course?.allowNewStudent === false && !hasActiveInvite) {
      return t.get('course.navItem.landing_page.pricing_section.not_accepting');
    }
    if (data.course?.status !== 'ACTIVE' || !data.course?.isPublished) {
      return 'This course is currently unavailable for enrollment.';
    }
    if (data.invite && inviteStatus === 'EXPIRED') {
      return 'This invite link has expired.';
    }
    if (data.invite && inviteStatus === 'USED_UP') {
      return 'This invite link has reached its usage limit.';
    }
    if (data.invite && inviteStatus === 'REVOKED') {
      return 'This invite link has been revoked.';
    }
    if (data.invite && inviteStatus !== 'ACTIVE') {
      return 'This invite link is not valid.';
    }
    return '';
  }

  async function completeEnrollment() {
    if (!data.course?.id || enrollmentInFlight || enrollmentSucceeded) {
      return;
    }

    enrollmentInFlight = true;
    loading = true;

    let navigatingAway = false;

    try {
      const body = data.token ? { inviteToken: data.token } : {};
      const result = await courseApi.enroll(data.course.id, body);

      if (!result?.data) {
        snackbar.error('snackbar.invite.failed_join');
        return;
      }

      enrollmentSucceeded = true;

      const studentId = $profile.id || sessionUser?.id || '';
      const studentEmail = $profile.email || sessionUser?.email || '';

      capturePosthogEvent('student_joined_course', {
        course_name: data.course?.title,
        student_id: studentId,
        student_email: studentEmail,
        already_joined: result.data.alreadyJoined
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
      await goto(resolve(getStudentCourseContinuePath(data.course.id), {}));
    } finally {
      enrollmentInFlight = false;
      if (!navigatingAway) {
        loading = false;
      }
    }
  }

  async function handleSubmit() {
    if (!canJoinCourse) {
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

    const redirectPath = page.url?.pathname ?? `/course/${data.course?.slug ?? ''}/enroll`;
    const redirectSearch = data.token ? `?invite_token=${encodeURIComponent(data.token)}` : '';
    const redirectUrl = `${redirectPath}${redirectSearch}`;

    const inviteEmail = data.inviteEmail ?? '';
    const target = data.inviteEmailExists ? '/login' : '/signup';
    const params = new URLSearchParams({ redirect: redirectUrl });
    if (inviteEmail) params.set('email', inviteEmail);

    goto(resolve(`${target}?${params.toString()}`, {}));
    loading = false;
  }

  $effect(() => {
    if (!sessionReady || !isLoggedIn || !canJoinCourse || enrollmentInFlight || loading || enrollmentSucceeded) {
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
  <title>Join {data.course?.title ?? 'Course'} on ClassroomIO</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<AuthUI
  isLogin={false}
  {handleSubmit}
  isLoading={loading || !sessionReady || (isLoggedIn && canJoinCourse && enrollmentInFlight)}
  showOnlyContent={true}
  showLogo={true}
>
  <div class="mt-0 w-full">
    <h3 class="mt-0 mb-4 text-center text-lg font-medium dark:text-white">{data.course?.title}</h3>
    <p class="text-center text-sm font-light dark:text-white">{data.course?.description}</p>
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
        href={resolve(`/course/${data.course?.slug ?? ''}`, {})}
        class="ui:text-primary ui:underline mt-3 block text-center text-sm"
      >
        {$t('course.navItem.landing_page.enroll_page.back_to_course')}
      </a>
    {:else if !canJoinCourse}
      <p class="mt-3 text-center text-sm text-red-500">{getBlockedMessage()}</p>
    {/if}
  </div>

  {#if !enrolledPendingVerification && (!isLoggedIn || (isLoggedIn && canJoinCourse && !enrollmentInFlight))}
    <div class="my-4 flex w-full items-center justify-center">
      <Button type="submit" disabled={!canJoinCourse || loading || !sessionReady || enrollmentInFlight} {loading}>
        {$t('course.navItem.landing_page.enroll_page.join_course')}
      </Button>
    </div>
  {/if}
</AuthUI>
