<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { ScrollToTop } from '@cio/ui/custom/scroll-to-top';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/ScrollToTop',
    component: ScrollToTop,
    parameters: {
      controls: { include: FIELDS }
    },
    argTypes: {
      label: { control: 'text' },
      target: { control: false },
      clearance: { control: 'select', options: ['default', 'mobile-nav', 'ask-ai'] },
      class: { control: false },
      forceVisible: { control: 'boolean' }
    },
    tags: ['autodocs']
  });
</script>

<script lang="ts">
  let overflowTarget: HTMLElement | null = $state(null);
  let shortTarget: HTMLElement | null = $state(null);
</script>

<Story name="In overflowing container">
  {#snippet template()}
    <div
      bind:this={overflowTarget}
      style="height: 18rem; width: 28rem; overflow: auto; border: 1px solid #cbd5e1; padding: 1rem;"
    >
      <div style="height: 70rem;">
        <p>Scroll this container down by one viewport to reveal the button.</p>
        <p style="margin-top: 48rem;">The button scrolls this container back to the top.</p>
      </div>
      <ScrollToTop label="Back to top" target={overflowTarget} />
    </div>
  {/snippet}
</Story>

<Story name="No overflow">
  {#snippet template()}
    <div
      bind:this={shortTarget}
      style="height: 12rem; width: 28rem; overflow: auto; border: 1px solid #cbd5e1; padding: 1rem;"
    >
      <p>This container fits within its viewport, so the button stays hidden.</p>
      <ScrollToTop label="Back to top" target={shortTarget} />
    </div>
  {/snippet}
</Story>

<Story name="Default placement">
  {#snippet template()}
    <div style="height: 20rem; width: 32rem; border: 1px solid #cbd5e1; padding: 1rem;">
      <p>The floating control is visible here to show its default placement.</p>
      <ScrollToTop label="Back to top" forceVisible />
    </div>
  {/snippet}
</Story>

<Story name="Mobile navigation clearance">
  {#snippet template()}
    <div style="height: 20rem; width: 32rem; border: 1px solid #cbd5e1; padding: 1rem;">
      <p>The mobile navigation preset lifts the control above a fixed bottom bar.</p>
      <ScrollToTop label="Back to top" clearance="mobile-nav" forceVisible />
    </div>
  {/snippet}
</Story>

<Story name="Ask AI clearance">
  {#snippet template()}
    <div style="height: 20rem; width: 32rem; border: 1px solid #cbd5e1; padding: 1rem;">
      <p>The Ask AI preset leaves room for the collapsed tutor bar on small screens.</p>
      <ScrollToTop label="Back to top" clearance="ask-ai" forceVisible />
    </div>
  {/snippet}
</Story>
