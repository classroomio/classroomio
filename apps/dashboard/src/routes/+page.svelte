<script lang="ts">
  import { onMount } from 'svelte';

  import { appInitApi } from '$features/app/init.svelte';
  import { Spinner } from '@cio/ui/base/spinner';
  import { Button } from '@cio/ui/base/button';
  import FrownIcon from '@lucide/svelte/icons/frown';
  import { Empty } from '@cio/ui/custom/empty';
  import { SimpleLogoNav } from '@cio/ui/custom/simple-logo-nav';
  import { buildOrgLandingPageProps, normalizeLandingPageSettings } from '$features/org/utils/landing-page';
  import { user } from '$lib/utils/store/user';
  import { getOrgLandingAuthAction } from '$features/org/utils/org-landing-auth-action';

  let { data } = $props();

  const hasSetupError = $derived(!appInitApi.loading && !!appInitApi.error);

  const pageTitle = $derived(
    data.isOrgSite && data.org
      ? data.org.name
      : 'ClassroomIO - One Platform for Customer, Partner, and Employee Training'
  );

  const authAction = $derived.by(() =>
    data.org
      ? getOrgLandingAuthAction({
          isLoggedIn: $user.isLoggedIn,
          isInitialized: appInitApi.isInitializedAndReady,
          org: data.org,
          organizations: appInitApi.data?.success ? appInitApi.data.organizations : [],
          hasPendingInvite: !!appInitApi.pendingOrgInvite
        })
      : undefined
  );
  const ThemeComponent = $derived(data.ThemeComponent);

  const landingPageProps = $derived.by(() => {
    if (!data.isOrgSite || !data.org) return null;

    return buildOrgLandingPageProps(
      data.org,
      normalizeLandingPageSettings(data.org.landingpage),
      data.courses,
      data.hasMoreCourses,
      authAction
    );
  });

  onMount(() => {
    if (!data.isOrgSite || !data.org) {
      if (!appInitApi.loading) {
        appInitApi.setupApp(data.locals, {
          isOrgSite: data.isOrgSite,
          orgSiteName: data.orgSiteName
        });
      }
    }
  });
</script>

<svelte:head>
  <title>{pageTitle}</title>
</svelte:head>

{#if data.isOrgSite && data.org}
  {#if ThemeComponent && landingPageProps}
    <ThemeComponent {...landingPageProps} />
  {/if}
{:else if hasSetupError}
  <Empty
    title="Something Went Wrong"
    description="We encountered an unexpected error. Please reload the page or contact us for support."
    icon={FrownIcon}
    variant="page"
    layout="full-page"
    showLogo={true}
  >
    <p class="my-2 text-red-500">{appInitApi.error}</p>
    <div class="flex gap-2">
      <Button variant="secondary" onclick={() => window.location.reload()}>Reload Page</Button>
      <Button variant="default" href="https://classroomio.com/contact">Contact Us</Button>
    </div>
  </Empty>
{:else}
  <div class="m-2 flex h-screen w-screen flex-col items-center justify-center font-sans sm:m-0">
    <SimpleLogoNav />
    <Spinner class="size-14! text-blue-700!" />
  </div>
{/if}
