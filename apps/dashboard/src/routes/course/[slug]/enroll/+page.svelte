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

  let { data } = $props();

  let loading = $state(false);

  const inviteStatus = $derived(data.invite?.status ?? 'INVALID');
  const canJoinCourse = $derived(
    data.requiresPaymentOrInvite
      ? false
      : (inviteStatus === 'ACTIVE' || !data.invite) &&
          data.course?.allowNewStudent !== false &&
          data.course?.status === 'ACTIVE' &&
          Boolean(data.course?.isPublished)
  );

  function getBlockedMessage(): string {
    if (data.requiresPaymentOrInvite) {
      return t.get('course.navItem.landing_page.enroll_page.requires_payment_or_invite');
    }
    if (data.course?.allowNewStudent === false) {
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

  async function handleSubmit() {
    if (!canJoinCourse) {
      snackbar.error(getBlockedMessage());
      return;
    }

    loading = true;

    const redirectPath = page.url?.pathname ?? `/course/${data.course?.slug ?? ''}/enroll`;
    const redirectSearch = data.token ? `?invite_token=${encodeURIComponent(data.token)}` : '';
    const redirectUrl = `${redirectPath}${redirectSearch}`;

    if (!$profile.id || !$profile.email) {
      goto(resolve(`/signup?redirect=${encodeURIComponent(redirectUrl)}`, {}));
      loading = false;
      return;
    }

    try {
      const body = data.token ? { inviteToken: data.token } : {};
      const result = await courseApi.enroll(data.course!.id, body);

      if (!result?.data) {
        return;
      }

      capturePosthogEvent('student_joined_course', {
        course_name: data.course?.title,
        student_id: $profile.id,
        student_email: $profile.email,
        already_joined: result.data.alreadyJoined
      });

      goto(result.data.redirectTo || '/lms');
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    if (!data.currentOrg) return;
    setTheme(data.currentOrg?.theme || '');
    currentOrg.update((o) => ({
      ...o,
      id: data.currentOrg?.id ?? o.id,
      name: data.currentOrg?.name ?? o.name,
      siteName: data.currentOrg?.siteName ?? o.siteName,
      theme: data.currentOrg?.theme ?? o.theme
    }));
  });
</script>

<svelte:head>
  <title>Join {data.course?.title ?? 'Course'} on ClassroomIO</title>
</svelte:head>

<AuthUI isLogin={false} {handleSubmit} isLoading={loading || !$profile.id} showOnlyContent={true} showLogo={true}>
  <div class="mt-0 w-full">
    <h3 class="mt-0 mb-4 text-center text-lg font-medium dark:text-white">{data.course?.title}</h3>
    <p class="text-center text-sm font-light dark:text-white">{data.course?.description}</p>
    {#if data.requiresPaymentOrInvite}
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

  <div class="my-4 flex w-full items-center justify-center">
    <Button type="submit" disabled={!canJoinCourse || loading} loading={loading || !$profile.id}>
      {$t('course.navItem.landing_page.enroll_page.join_course')}
    </Button>
  </div>
</AuthUI>
