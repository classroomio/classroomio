<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { ImageLightbox, ZoomableHtmlContent, ZoomableImage } from '@cio/ui/custom/image-lightbox';
  import ImageLightboxDemo from './image-lightbox-demo.svelte';
  import { LIGHTBOX_LABELS, SCREENSHOTS } from './fixtures';
  import { FIELDS } from './fields';

  const RICH_CONTENT = `<p>Open the quote editor below, then check the totals.</p><img src="${SCREENSHOTS[1].src}" alt="${SCREENSHOTS[1].alt}" /><p>Compare it with the settings screen:</p><img src="${SCREENSHOTS[2].src}" alt="" />`;

  const { Story } = defineMeta({
    title: 'Molecules/ImageLightbox',
    component: ImageLightbox,
    parameters: {
      layout: 'padded',
      controls: {
        include: FIELDS
      }
    },
    tags: ['autodocs']
  });
</script>

<Story name="Single Image">
  {#snippet template()}
    <ImageLightboxDemo images={SCREENSHOTS.slice(0, 1)} />
  {/snippet}
</Story>

<Story name="Image Grid">
  {#snippet template()}
    <ImageLightboxDemo images={SCREENSHOTS} />
  {/snippet}
</Story>

<Story name="Open Single">
  {#snippet template()}
    <ImageLightboxDemo images={SCREENSHOTS.slice(0, 1)} initiallyOpen />
  {/snippet}
</Story>

<Story name="Open Gallery">
  {#snippet template()}
    <ImageLightboxDemo images={SCREENSHOTS} initiallyOpen />
  {/snippet}
</Story>

<Story name="Closed">
  {#snippet template()}
    <ImageLightbox images={SCREENSHOTS} labels={LIGHTBOX_LABELS} />
  {/snippet}
</Story>

<Story name="Zoomable Image Only">
  {#snippet template()}
    <div class="max-w-sm">
      <ZoomableImage
        src={SCREENSHOTS[1].src}
        alt={SCREENSHOTS[1].alt}
        enlargeLabel="Click to enlarge"
        class="aspect-video"
        onclick={() => {}}
      />
    </div>
  {/snippet}
</Story>

<Story name="Zoomable Html Content">
  {#snippet template()}
    <div class="max-w-2xl space-y-2 text-sm [&_img]:my-2 [&_img]:max-w-full [&_img]:rounded-md [&_img]:border">
      <ZoomableHtmlContent
        content={RICH_CONTENT}
        labels={LIGHTBOX_LABELS}
        enlargeLabel="Click to enlarge"
        fallbackAlt="Question context"
      />
    </div>
  {/snippet}
</Story>
