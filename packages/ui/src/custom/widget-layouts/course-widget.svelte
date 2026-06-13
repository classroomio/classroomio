<script lang="ts">
  import type { TWidgetPayload } from '@cio/utils/validation/widget';
  import CardGrid from './card-grid.svelte';
  import TagFilter from './tag-filter.svelte';
  import Carousel from './carousel.svelte';
  import PrimaryCourse from './primary-course.svelte';
  import CompactList from './compact-list.svelte';
  import EditorialSpotlight from './editorial-spotlight.svelte';
  import CategoryShelf from './category-shelf.svelte';
  import { ensureWidgetGoogleFontsLoaded } from './ensure-google-fonts';
  import { buildCssVarsFromDesign, buildPoweredByMarketingUrl } from './utils';

  let { payload }: { payload: TWidgetPayload | null | undefined } = $props();

  let rootEl: HTMLDivElement | null = null;

  const cssVars = $derived(payload ? buildCssVarsFromDesign(payload.design) : '');
  const poweredByHref = $derived(payload ? buildPoweredByMarketingUrl(payload) : '');
  const customCss = $derived(payload?.design.advanced.customCss?.trim() ?? '');

  $effect(() => {
    if (!payload || !rootEl) return;
    ensureWidgetGoogleFontsLoaded(rootEl, payload.design);
  });

  $effect(() => {
    if (!rootEl) return;
    const existing = rootEl.querySelector<HTMLStyleElement>('[data-cio-widget-custom-css]');
    if (existing) existing.remove();
    if (!customCss) return;
    const styleEl = document.createElement('style');
    styleEl.setAttribute('data-cio-widget-custom-css', '');
    styleEl.textContent = customCss;
    rootEl.appendChild(styleEl);
  });
</script>

{#if !payload}
  <div class="cio-widget cio-widget--empty">No widget payload provided.</div>
{:else}
  <div bind:this={rootEl} class="cio-widget" style={cssVars} data-cio-layout={payload.layoutType}>
    {#if payload.layoutType === 'card_grid'}
      <CardGrid {payload} />
    {:else if payload.layoutType === 'tag_filter'}
      <TagFilter {payload} />
    {:else if payload.layoutType === 'carousel'}
      <Carousel {payload} />
    {:else if payload.layoutType === 'primary_course'}
      <PrimaryCourse {payload} />
    {:else if payload.layoutType === 'compact_list'}
      <CompactList {payload} />
    {:else if payload.layoutType === 'editorial_spotlight'}
      <EditorialSpotlight {payload} />
    {:else if payload.layoutType === 'category_shelf'}
      <CategoryShelf {payload} />
    {/if}

    {#if payload.design.branding.showPoweredBy}
      <a class="cio-branding" href={poweredByHref} target="_blank" rel="noopener noreferrer">
        {payload.labels.poweredByLabel}
      </a>
    {/if}
  </div>
{/if}
