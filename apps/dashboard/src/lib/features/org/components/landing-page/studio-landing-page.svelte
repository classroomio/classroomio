<script lang="ts">
  import type { LandingPagePresentationV1, LandingPageRenderData } from '@cio/landing-pages';
  import { renderLandingPage } from '@cio/landing-pages';

  interface Props {
    presentation: LandingPagePresentationV1;
    renderData: LandingPageRenderData;
  }

  let { presentation, renderData }: Props = $props();

  const rendered = $derived(renderLandingPage(presentation.document, renderData));
</script>

<svelte:head>
  <title>{rendered.meta.title}</title>
  {#if rendered.meta.description}
    <meta name="description" content={rendered.meta.description} />
    <meta property="og:description" content={rendered.meta.description} />
  {/if}
  {#if rendered.meta.socialImageUrl}
    <meta property="og:image" content={rendered.meta.socialImageUrl} />
    <meta name="twitter:image" content={rendered.meta.socialImageUrl} />
  {/if}
  {#if rendered.fontsHref}
    <link rel="stylesheet" href={rendered.fontsHref} />
  {/if}
  <svelte:element this="style">{rendered.css}</svelte:element>
</svelte:head>

{@html rendered.html}
