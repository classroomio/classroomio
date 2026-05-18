<script lang="ts">
  import type { Snippet } from 'svelte';
  import BottomNav from './bottom-nav.svelte';
  import FooterNav from './footer-nav.svelte';
  import MobileSheet from './mobile-sheet.svelte';
  import Sidebar from './sidebar.svelte';
  import { Button } from '../../base/button';
  import { cn } from '../../tools';
  import type { PublicCourseOrgData, PublicCourseSidebarItem, PublicCourseSidebarSection } from './types';
  import { ModeSwitcher } from '../../base/dark-mode';

  interface Props {
    sections: PublicCourseSidebarSection[];
    activeSlug?: string | null;
    hrefFor?: (item: PublicCourseSidebarItem) => string;
    onItemClick?: (item: PublicCourseSidebarItem) => void;
    /** Current item for the bottom nav display. If null, bottom nav is hidden. */
    activeItem?: PublicCourseSidebarItem | null;
    /** Index (0-based) of the active item in the flattened sequence. */
    activeFlatIndex?: number | null;
    /** Total number of items in the flattened sequence. */
    totalItems?: number;
    /** Prev / next item handlers for the bottom nav AND the in-page footer nav. */
    onPrev?: () => void;
    onNext?: () => void;
    hasPrev?: boolean;
    hasNext?: boolean;
    /** Previous / next sidebar items, used to render the in-page footer nav after the lesson body. */
    prevItem?: PublicCourseSidebarItem | null;
    nextItem?: PublicCourseSidebarItem | null;
    /** Course title shown after the org name in the top header. */
    courseTitle: string;
    /** Owning org / creator for the top-header logo + name. */
    org?: PublicCourseOrgData | null;
    /** Where clicking the org logo / name should go. Defaults to the org home (`/`). */
    homeHref?: string;
    /** Where the "Explore courses" button links to. */
    exploreHref?: string;
    /** Where the "Sign in" button links to. */
    signInHref?: string;
    /** Localized labels for the top-right header actions. */
    exploreLabel?: string;
    signInLabel?: string;
    /** Localized labels for the in-page footer nav. */
    footerPrevLabel?: string;
    footerNextLabel?: string;
    /** Course slug (used for the sidebar's powered-by attribution link). */
    courseSlug?: string | null;
    /** Localized strings for the sidebar's powered-by footer. */
    poweredByLabel?: string;
    poweredByBrand?: string;
    /** Hide the powered-by footer entirely (e.g. enterprise white-label). */
    showPoweredBy?: boolean;
    /** Main content. Typically a PublicLessonView or PublicExerciseView. */
    children: Snippet;
    /**
     * Optional override for the top-right header slot. When provided,
     * replaces the default Sign in / Explore courses buttons entirely.
     */
    topRight?: Snippet;
    class?: string;
  }

  let {
    sections,
    activeSlug = null,
    hrefFor,
    onItemClick,
    activeItem = null,
    activeFlatIndex = null,
    totalItems = 0,
    onPrev,
    onNext,
    hasPrev = false,
    hasNext = false,
    prevItem = null,
    nextItem = null,
    courseTitle,
    org = null,
    homeHref = '/',
    exploreHref = '/courses',
    signInHref = '/login',
    exploreLabel = 'Explore courses',
    signInLabel = 'Sign in',
    footerPrevLabel = 'Previous',
    footerNextLabel = 'Next',
    courseSlug = null,
    poweredByLabel = 'Powered by',
    poweredByBrand = 'ClassroomIO',
    showPoweredBy = true,
    children,
    topRight,
    class: className
  }: Props = $props();

  let sheetOpen = $state(false);

  const positionLabel = $derived(
    activeFlatIndex !== null && totalItems > 0 ? `${activeFlatIndex + 1} / ${totalItems}` : ''
  );

  const orgInitial = $derived((org?.name?.trim()?.charAt(0) ?? 'C').toUpperCase());

  /** Left/right arrow keys navigate between items when focus is not in an editable element. */
  function onKeydown(event: KeyboardEvent) {
    const target = event.target as HTMLElement | null;
    if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;

    if (event.key === 'ArrowLeft' && hasPrev) {
      event.preventDefault();
      onPrev?.();
    } else if (event.key === 'ArrowRight' && hasNext) {
      event.preventDefault();
      onNext?.();
    }
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div class={cn('ui:min-h-dvh ui:bg-background ui:text-foreground', className)}>
  <!--
    Top header. Sticky so it stays visible as guests scroll long lessons.
    Layout: [org logo · org name | course title]  ··· [Explore courses] [Sign in] [Theme]
    Height intentionally compact (h-12) to maximize content vertical space.
  -->
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

      <span aria-hidden="true" class="ui:text-muted-foreground/60">|</span>

      <span class="ui:min-w-0 ui:flex-1 ui:truncate ui:text-sm ui:text-muted-foreground" title={courseTitle}>
        {courseTitle}
      </span>

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

  <!--
    Layout: sidebar pinned to the far left of the viewport (no centered max-width
    container around it), main content centered inside its own column. The header
    above is 3rem (h-12), so sticky offsets are computed against that.
  -->
  <div class="ui:flex ui:min-h-[calc(100dvh-3rem)] ui:w-full">
    <aside
      class="ui:sticky ui:top-12 ui:hidden ui:h-[calc(100dvh-3rem)] ui:w-72 ui:shrink-0 ui:overflow-y-auto ui:border-r ui:border-border ui:lg:block"
      aria-label="Course outline sidebar"
    >
      <Sidebar
        {sections}
        {activeSlug}
        {hrefFor}
        onItemClick={hrefFor ? undefined : onItemClick}
        {showPoweredBy}
        {courseSlug}
        orgSlug={org?.siteName ?? org?.name ?? null}
        {poweredByLabel}
        {poweredByBrand}
      />
    </aside>

    <main class="ui:flex ui:min-w-0 ui:flex-1 ui:flex-col ui:pb-24 ui:lg:pb-12">
      {@render children()}

      {#if prevItem || nextItem}
        <div class="ui:mx-auto ui:w-full ui:max-w-3xl ui:px-4 ui:pb-10 ui:sm:px-6">
          <FooterNav
            prev={prevItem}
            next={nextItem}
            {hrefFor}
            onNavigate={hrefFor ? undefined : (item) => onItemClick?.(item)}
            prevLabel={footerPrevLabel}
            nextLabel={footerNextLabel}
          />
        </div>
      {/if}
    </main>
  </div>

  {#if activeItem}
    <BottomNav
      positionLabel={positionLabel || 'Outline'}
      sublineLabel={activeItem.title}
      {hasPrev}
      {hasNext}
      onPrev={() => onPrev?.()}
      onNext={() => onNext?.()}
      onOpenSheet={() => (sheetOpen = true)}
    />
  {/if}

  <MobileSheet
    bind:open={sheetOpen}
    {sections}
    {activeSlug}
    {hrefFor}
    {showPoweredBy}
    {courseSlug}
    orgSlug={org?.siteName ?? org?.name ?? null}
    {poweredByLabel}
    {poweredByBrand}
    onItemClick={(item) => {
      if (!hrefFor) {
        onItemClick?.(item);
      }
      sheetOpen = false;
    }}
  />
</div>
