<script lang="ts">
  import { onMount } from 'svelte';

  import { appInitApi } from '$features/app/init.svelte';
  import { BlockLoader } from '@cio/ui/custom/block-loader';
  import { Button } from '@cio/ui/base/button';
  import FrownIcon from '@lucide/svelte/icons/frown';
  import { Empty } from '@cio/ui/custom/empty';
  import { SimpleLogoNav } from '@cio/ui/custom/simple-logo-nav';
  import { buildOrgLandingPageProps, normalizeLandingPageSettings } from '$features/org/utils/landing-page';
  import { PublicPluginLandingFrame } from '$features/org';
  import { projectPublicLandingPageViewModel } from '@cio/utils/validation/organization';
  import { user, profile } from '$lib/utils/store/user';
  import { t } from '$lib/utils/functions/translations';
  import { resolveOrgLandingAuthAction } from '$features/org/utils/org-landing-auth-action';
  import { resolveOrgLandingLearnerAccount } from '$features/org/utils/org-landing-learner-account';

  let { data } = $props();

  const hasSetupError = $derived(!appInitApi.loading && !!appInitApi.error);

  const pageTitle = $derived(
    data.isOrgSite && data.org
      ? data.org.name
      : 'ClassroomIO - One Platform for Customer, Partner, and Employee Training'
  );

  const authAction = $derived(
    resolveOrgLandingAuthAction({
      org: { ...data.org, locale: data.org.settings?.language?.locale },
      locals: data.locals,
      user: $user,
      appInitApi
    })
  );

  const learnerAccount = $derived(
    resolveOrgLandingLearnerAccount({
      org: data.org,
      locals: data.locals,
      user: $user,
      profile: $profile,
      appInitApi
    })
  );

  const ThemeComponent = $derived(data.ThemeComponent);

  const landingPageProps = $derived.by(() => {
    if (!data.isOrgSite || !data.org) return null;

    return buildOrgLandingPageProps(
      data.org,
      normalizeLandingPageSettings(data.org.landingpage),
      data.courses,
      data.hasMoreCourses,
      authAction,
      { learnerAccount }
    );
  });

  const pluginViewModel = $derived.by(() => {
    if (!data.isOrgSite || !data.org || !data.pluginDescriptor) return null;

    return projectPublicLandingPageViewModel({
      theme: data.pluginDescriptor.templateId,
      templateId: data.pluginDescriptor.templateId,
      org: data.org,
      landingpage: data.org.landingpage,
      courses: data.courses,
      hasMoreCourses: data.hasMoreCourses,
      isAuthenticated: Boolean($user),
      signInLabel: authAction?.label
    });
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
  {#if data.pluginDescriptor && pluginViewModel}
    <PublicPluginLandingFrame srcUrl={data.pluginDescriptor.entrypointUrl} viewModel={pluginViewModel} />
  {:else if ThemeComponent && landingPageProps}
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
    <BlockLoader
      blockText={false}
      title={$t('common.loading_states.opening_academy.title')}
      caption={$t('common.loading_states.opening_academy.caption')}
    />
  </div>
{/if}
