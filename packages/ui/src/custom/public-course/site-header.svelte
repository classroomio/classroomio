<script lang="ts">
  import type { Snippet } from 'svelte';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import { Button } from '../../base/button';
  import { ModeSwitcher } from '../../base/dark-mode';
  import type { PublicCourseOrgData } from './types';

  export type PublicSiteBreadcrumb = {
    label: string;
    href?: string;
  };

  interface Props {
    org?: PublicCourseOrgData | null;
    /** Secondary title in the header (course name, note title, etc.). */
    pageTitle?: string;
    breadcrumbs?: PublicSiteBreadcrumb[];
    homeHref?: string;
    exploreHref?: string;
    signInHref?: string;
    exploreLabel?: string;
    signInLabel?: string;
    topRight?: Snippet;
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
    topRight
  }: Props = $props();

  const orgInitial = $derived((org?.name?.trim()?.charAt(0) ?? 'C').toUpperCase());
  const hasBreadcrumbs = $derived(breadcrumbs.length > 0);
  const showMiddle = $derived(hasBreadcrumbs || pageTitle.trim().length > 0);
</script>

<header
  class="ui:sticky ui:top-0 ui:z-30 ui:border-b ui:border-border ui:bg-background/95 ui:backdrop-blur ui:supports-[backdrop-filter]:bg-background/80"
>
  <div class="ui:flex ui:h-12 ui:items-center ui:gap-3 ui:px-4 ui:lg:px-6">
    <a
      href={homeHref}
      class="ui:flex ui:shrink-0 ui:items-center ui:gap-2 ui:rounded-md ui:focus-visible:outline-none ui:focus-visible:ring-2 ui:focus-visible:ring-ring"
    >
      {#if org?.avatarUrl}
        <img
          src={org.avatarUrl}
          alt=""
          class="ui:size-6 ui:rounded ui:object-cover"
          width="24"
          height="24"
          loading="lazy"
        />
      {:else}
        <span
          class="ui:flex ui:size-6 ui:items-center ui:justify-center ui:rounded ui:bg-primary/10 ui:text-[11px] ui:font-semibold ui:text-primary"
          aria-hidden="true"
        >
          {orgInitial}
        </span>
      {/if}
      <span class="ui:truncate ui:text-sm ui:font-medium ui:text-foreground">
        {org?.name ?? ''}
      </span>
    </a>

    {#if showMiddle}
      <span aria-hidden="true" class="ui:text-muted-foreground/60">|</span>

      {#if hasBreadcrumbs}
        <nav
          class="ui:flex ui:min-w-0 ui:flex-1 ui:items-center ui:gap-1 ui:text-sm ui:text-muted-foreground"
          aria-label="Breadcrumb"
        >
          {#each breadcrumbs as crumb, index (crumb.label + (crumb.href ?? ''))}
            {#if index > 0}
              <ChevronRightIcon size={14} class="ui:shrink-0 ui:opacity-60" aria-hidden="true" />
            {/if}
            {#if crumb.href}
              <a href={crumb.href} class="ui:max-w-[9rem] ui:truncate ui:hover:text-foreground sm:ui:max-w-[12rem]">
                {crumb.label}
              </a>
            {:else}
              <span class="ui:max-w-[9rem] ui:truncate sm:ui:max-w-[16rem]" title={crumb.label}>
                {crumb.label}
              </span>
            {/if}
          {/each}
        </nav>
      {:else}
        <span class="ui:min-w-0 ui:flex-1 ui:truncate ui:text-sm ui:text-muted-foreground" title={pageTitle}>
          {pageTitle}
        </span>
      {/if}
    {:else}
      <span class="ui:min-w-0 ui:flex-1"></span>
    {/if}

    <div class="ui:ml-auto ui:flex ui:shrink-0 ui:items-center ui:gap-2">
      {#if topRight}
        {@render topRight()}
      {:else}
        <Button href={exploreHref} variant="secondary" size="sm" class="ui:hidden ui:sm:inline-flex">
          {exploreLabel}
        </Button>
        <Button href={signInHref} variant="default" size="sm">{signInLabel}</Button>
      {/if}
      <ModeSwitcher />
    </div>
  </div>
</header>
