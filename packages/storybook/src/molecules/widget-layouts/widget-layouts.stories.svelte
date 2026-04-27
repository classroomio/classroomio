<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { onMount, onDestroy } from 'svelte';
  import { CourseWidget, widgetStyles } from '@cio/ui/custom/widget-layouts';
  import { FIELDS } from './fields';
  import { makeFixturePayload } from './fixtures';

  const { Story } = defineMeta({
    title: 'Molecules/WidgetLayouts',
    component: CourseWidget,
    tags: ['autodocs'],
    args: {
      payload: makeFixturePayload('card_grid')
    },
    parameters: {
      layout: 'fullscreen',
      controls: {
        include: FIELDS
      }
    }
  });
</script>

<script lang="ts">
  let styleEl: HTMLStyleElement | null = null;

  onMount(() => {
    styleEl = document.createElement('style');
    styleEl.setAttribute('data-cio-widget-stories', '');
    styleEl.textContent = widgetStyles;
    document.head.appendChild(styleEl);
  });

  onDestroy(() => {
    if (styleEl?.parentNode) {
      styleEl.parentNode.removeChild(styleEl);
    }
  });
</script>

<Story name="Card grid" args={{ payload: makeFixturePayload('card_grid') }}>
  {#snippet template(args)}
    <div style="padding: 24px; background: #f5f6f8;">
      <CourseWidget payload={args.payload} />
    </div>
  {/snippet}
</Story>

<Story name="Tag filter" args={{ payload: makeFixturePayload('tag_filter') }}>
  {#snippet template(args)}
    <div style="padding: 24px; background: #f5f6f8;">
      <CourseWidget payload={args.payload} />
    </div>
  {/snippet}
</Story>

<Story name="Carousel" args={{ payload: makeFixturePayload('carousel') }}>
  {#snippet template(args)}
    <div style="padding: 24px; background: #f5f6f8;">
      <CourseWidget payload={args.payload} />
    </div>
  {/snippet}
</Story>

<Story name="Primary course" args={{ payload: makeFixturePayload('primary_course') }}>
  {#snippet template(args)}
    <div style="padding: 24px; background: #f5f6f8;">
      <CourseWidget payload={args.payload} />
    </div>
  {/snippet}
</Story>

<Story name="Compact list" args={{ payload: makeFixturePayload('compact_list') }}>
  {#snippet template(args)}
    <div style="padding: 24px; background: #f5f6f8; max-width: 480px;">
      <CourseWidget payload={args.payload} />
    </div>
  {/snippet}
</Story>

<Story name="Editorial spotlight" args={{ payload: makeFixturePayload('editorial_spotlight') }}>
  {#snippet template(args)}
    <div style="padding: 24px; background: #f5f6f8;">
      <CourseWidget payload={args.payload} />
    </div>
  {/snippet}
</Story>

<Story name="Category shelf" args={{ payload: makeFixturePayload('category_shelf') }}>
  {#snippet template(args)}
    <div style="padding: 24px; background: #f5f6f8;">
      <CourseWidget payload={args.payload} />
    </div>
  {/snippet}
</Story>
