<script lang="ts">
  import type { Component } from 'svelte';
  import { resolve } from '$app/paths';
  import get from 'lodash/get';

  import { currentOrg } from '$lib/utils/store/org';
  import { basePath } from '$lib/utils/store/app';
  import { user } from '$lib/utils/store/user';
  import { t } from '$lib/utils/functions/translations';
  import { isSelfEnrollmentAllowed } from '@cio/utils/functions';
  import { importCourseLandingPageTheme, normalizeLandingPageSettings } from '$features/org/utils/landing-page';
  import type { Course } from '$features/course/utils/types';
  import type { AccountOrg } from '$features/app/types';
  import UploadWidget from '$features/ui/upload-widget/upload-widget.svelte';
  import PaymentModal from './components/payment-modal.svelte';
  import { buildCourseLandingPageProps } from './utils';
  import { handleOpenWidget } from './store';
  import { calcCourseCost, isCourseFree } from '$lib/utils/functions/course';
  import { capturePosthogEvent } from '$lib/utils/services/posthog';
  import { appInitApi } from '$features/app/init.svelte';
  import { getOrgLandingAuthAction } from '$features/org/utils/org-landing-auth-action';

  interface Props {
    editMode?: boolean;
    courseData: Course;
    org?: AccountOrg | null;
    /** Pre-resolved theme component from the route's load function (eliminates the flash on SSR pages). */
    themeComponent?: Component | null;
  }

  let { editMode = false, courseData = $bindable(), org = null, themeComponent = null }: Props = $props();

  let openPaymentModal = $state(false);

  const activeOrg = $derived(org ?? $currentOrg);
  const landingSettings = $derived(normalizeLandingPageSettings(activeOrg.landingpage));

  const authAction = $derived.by(() => {
    if (editMode) {
      return $user.isLoggedIn
        ? {
            label: t.get(
              $basePath === '/lms' || $basePath === '#' ? 'navigation.goto_lms' : 'navigation.goto_dashboard'
            ),
            href: resolve($basePath !== '#' ? $basePath : '/lms', {})
          }
        : {
            label: t.get('navigation.login'),
            href: '/login'
          };
    }

    return getOrgLandingAuthAction({
      isLoggedIn: $user.isLoggedIn,
      isInitialized: appInitApi.isInitializedAndReady,
      org: activeOrg,
      organizations: appInitApi.data?.success ? appInitApi.data.organizations : [],
      hasPendingInvite: !!appInitApi.pendingOrgInvite
    });
  });

  const enrollHref = $derived.by(() => {
    const slug = typeof courseData.slug === 'string' && courseData.slug.length > 0 ? courseData.slug : '';
    return slug ? resolve(`/course/${slug}/enroll`, {}) : '#';
  });

  const enrollmentsOpen = $derived(isSelfEnrollmentAllowed(courseData?.metadata));
  const enrollDisabled = $derived(editMode || !enrollmentsOpen);

  const calculatedCost = $derived(calcCourseCost(courseData));
  const isFree = $derived(isCourseFree(calculatedCost));

  function handlePaidEnrollClick(event: MouseEvent) {
    event.preventDefault();

    if (editMode || !activeOrg.siteName) {
      return;
    }

    capturePosthogEvent('join_course', {
      course_id: courseData.id,
      course_title: courseData.title,
      course_cost: courseData.cost,
      course_free: isFree
    });

    openPaymentModal = true;
  }

  const landingProps = $derived(
    buildCourseLandingPageProps(courseData, activeOrg, {
      enrollHref,
      enrollDisabled,
      authAction,
      onPaidEnrollClick: handlePaidEnrollClick
    })
  );

  let importedThemeComponent = $state<Component | null>(null);
  const ThemeComponent = $derived(themeComponent ?? importedThemeComponent);

  $effect(() => {
    // Skip client-side loading if the theme was already resolved server-side.
    if (themeComponent) {
      return;
    }

    const theme = landingSettings.theme;
    let cancelled = false;

    void importCourseLandingPageTheme(theme).then((mod) => {
      if (!cancelled) {
        importedThemeComponent = mod.default;
      }
    });

    return () => {
      cancelled = true;
    };
  });
</script>

<PaymentModal
  bind:open={openPaymentModal}
  paymentLink={get(courseData, 'metadata.paymentLink', '')}
  courseId={courseData.id}
/>

{#if ThemeComponent}
  {#if editMode && $handleOpenWidget.open}
    <div class="mx-auto w-full max-w-7xl px-6 py-3">
      <UploadWidget imageURL={courseData.logo} onchange={(newLogo) => (courseData.logo = newLogo)} />
    </div>
  {/if}
  <ThemeComponent {...landingProps} />
{/if}
