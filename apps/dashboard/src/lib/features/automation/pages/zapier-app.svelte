<script lang="ts">
  import ZapIcon from '@lucide/svelte/icons/zap';
  import * as Alert from '@cio/ui/base/alert';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import { Empty } from '@cio/ui/custom/empty';
  import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';
  import type { TZapierPartnerApp } from '@cio/utils/constants/zapier';

  import { zapierApi } from '$features/automation/api/zapier.svelte';
  import ZapierAppHero from '$features/automation/components/zapier-app-hero.svelte';
  import ZapierCapabilityReference from '$features/automation/components/zapier-capability-reference.svelte';
  import ZapierConnectedBanner from '$features/automation/components/zapier-connected-banner.svelte';
  import ZapierRecipeBuilder from '$features/automation/components/zapier-recipe-builder.svelte';
  import ZapierRecipeList from '$features/automation/components/zapier-recipe-list.svelte';
  import ZapierSimilarApps from '$features/automation/components/zapier-similar-apps.svelte';
  import ZapierTrustStrip from '$features/automation/components/zapier-trust-strip.svelte';
  import { getZapierAccess, getZapierPrimaryRecipe } from '$features/automation/utils/zapier-utils';
  import { UpgradeBanner } from '$features/ui';
  import { cohortApi } from '$features/cohort/api/cohort.svelte';
  import { coursesApi } from '$features/course/api/courses.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg, currentOrgPath, hasPublicApiAccess, isOrgAdmin } from '$lib/utils/store/org';

  interface Props {
    app: TZapierPartnerApp;
  }

  let { app }: Props = $props();

  const T = 'automation.zapier';
  const isSelfHosted = PUBLIC_IS_SELFHOSTED === 'true';

  const primaryRecipe = $derived(getZapierPrimaryRecipe(app));
  const overview = $derived(zapierApi.overview);
  const connection = $derived(overview?.connections[0] ?? null);
  const access = $derived(connection ? getZapierAccess(connection.scopes) : 'read_write');
  const zapsHref = $derived(`${$currentOrgPath}/automation/zapier`);

  const courses = $derived(coursesApi.orgCourses.map((course) => ({ id: course.id, title: course.title })));
  const cohorts = $derived(cohortApi.cohorts.map((cohort) => ({ id: cohort.id, title: cohort.name })));

  let loadedScope = '';
  let prefillLoaded = false;

  $effect(() => {
    const organizationId = $currentOrg.id;
    const isAdmin = $isOrgAdmin === true;

    if (!organizationId) return;

    const scope = `${organizationId}:${isAdmin}`;
    if (scope === loadedScope) return;

    if (loadedScope) zapierApi.resetOrganizationState();
    loadedScope = scope;

    if (!isAdmin) return;

    void zapierApi.loadOnce();
  });

  $effect(() => {
    if (prefillLoaded || $isOrgAdmin !== true || !$currentOrg.id) return;

    prefillLoaded = true;
    void coursesApi.getOrgCourses();
    void cohortApi.listCohorts();
  });
</script>

{#if $isOrgAdmin === false}
  <Alert.Callout
    variant="information"
    title={$t('automation.permissions.disabled_title')}
    description={$t(`${T}.permissions_description`)}
    class="w-full"
  />
{:else if $isOrgAdmin === null}
  <div class="space-y-2">
    {#each [0, 1, 2] as index (index)}
      <Skeleton class="h-12 w-full" />
    {/each}
  </div>
{:else if isSelfHosted}
  <Alert.Callout
    variant="information"
    title={$t(`${T}.selfhosted.title`)}
    description={$t(`${T}.selfhosted.description`)}
    class="w-full"
  />
{:else}
  <div class="flex flex-col gap-8" data-testid="zapier-app-page">
    {#if !$hasPublicApiAccess}
      <UpgradeBanner visible>{$t('upgrade.zapier_required')}</UpgradeBanner>
    {/if}

    {#if primaryRecipe}
      <ZapierAppHero {app} recipe={primaryRecipe} recipeCount={app.recipes.length} />
    {:else}
      <Empty
        title={$t(`${T}.app_sheet.title`, { app: app.name })}
        description={$t(`${T}.apps.${app.slug}.description`)}
        icon={ZapIcon}
        variant="page"
      />
    {/if}

    <div class="mx-auto flex w-full max-w-[1080px] flex-col gap-8">
      {#if connection}
        <ZapierConnectedBanner {connection} organizationName={$currentOrg.name} {zapsHref} />
      {/if}

      <ZapierTrustStrip {access} organizationName={$currentOrg.name} />

      <ZapierRecipeList {app} {courses} {cohorts} />

      <ZapierRecipeBuilder {app} {courses} {cohorts} />

      <ZapierCapabilityReference />

      <ZapierSimilarApps {app} />
    </div>
  </div>
{/if}
