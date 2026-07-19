<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '../../tools';
  import PoweredBy from './powered-by.svelte';
  import SiteHeader from './site-header.svelte';
  import type { PublicSiteBreadcrumb } from './site-header.svelte';
  import type { PublicCourseOrgData } from './types';

  interface Props {
    org?: PublicCourseOrgData | null;
    pageTitle?: string;
    breadcrumbs?: PublicSiteBreadcrumb[];
    homeHref?: string;
    exploreHref?: string;
    signInHref?: string;
    exploreLabel?: string;
    signInLabel?: string;
    poweredByLabel?: string;
    poweredByBrand?: string;
    showPoweredBy?: boolean;
    topRight?: Snippet;
    children: Snippet;
    class?: string;
  }

  let {
    org = null,
    pageTitle = '',
    breadcrumbs = [],
    homeHref = '/',
    exploreHref = '/courses',
    signInHref = '/login',
    exploreLabel = 'Explore courses',
    signInLabel = 'Sign in',
    poweredByLabel = 'Powered by',
    poweredByBrand = 'ClassroomIO',
    showPoweredBy = true,
    topRight,
    children,
    class: className
  }: Props = $props();

  const orgSlug = $derived(org?.siteName ?? org?.name ?? null);
</script>

<div class={cn('ui:min-h-dvh ui:bg-background ui:text-foreground', className)}>
  <SiteHeader
    {org}
    {pageTitle}
    {breadcrumbs}
    {homeHref}
    {exploreHref}
    {signInHref}
    {exploreLabel}
    {signInLabel}
    {topRight}
  />

  <main class="ui:flex ui:min-h-[calc(100dvh-3rem)] ui:flex-col">
    {@render children()}

    {#if showPoweredBy}
      <div class="ui:mt-auto ui:border-t ui:border-border ui:py-4">
        <PoweredBy
          orgSlug={orgSlug}
          utmSource="public-note"
          {poweredByLabel}
          {poweredByBrand}
          align="start"
          class="ui:px-4 ui:lg:px-6"
        />
      </div>
    {/if}
  </main>
</div>
