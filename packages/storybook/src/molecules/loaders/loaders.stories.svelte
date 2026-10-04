<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { BlockLoader } from '@cio/ui/custom/block-loader';
  import { CompactLoader } from '@cio/ui/custom/compact-loader';

  const { Story } = defineMeta({
    title: 'Molecules/Loaders',
    parameters: {
      layout: 'fullscreen'
    },
    tags: ['autodocs']
  });
</script>

<Story name="BlockLoader">
  {#snippet template()}
    <div class="flex h-[560px] w-full items-center justify-center">
      <BlockLoader
        title="Opening your academy…"
        caption="Blocks drop into place one at a time, then clear and repeat."
      />
    </div>
  {/snippet}
</Story>

<Story name="BlockLoader without text">
  {#snippet template()}
    <div class="flex h-[480px] w-full items-center justify-center">
      <BlockLoader label="Loading" />
    </div>
  {/snippet}
</Story>

<Story name="BlockLoader custom blocks">
  {#snippet template()}
    <div class="flex h-[480px] w-full items-center justify-center">
      <BlockLoader
        title="Preparing your cohort…"
        blocks={[
          { kind: 'WEEK 1', title: 'Welcome', tone: 'muted', width: 320 },
          { kind: 'WEEK 2', title: 'Hands-on lab', tone: 'tint', width: 340 },
          { kind: 'EXAM', title: 'Final check', tone: 'primary', width: 300 }
        ]}
      />
    </div>
  {/snippet}
</Story>

<Story name="BlockLoader on a muted card">
  {#snippet template()}
    <div class="ui:bg-muted mx-auto my-8 flex h-[520px] w-full max-w-2xl items-center justify-center rounded-xl border">
      <BlockLoader title="Loading course…" caption="Please wait while we load your course data." />
    </div>
  {/snippet}
</Story>

<Story name="CompactLoader">
  {#snippet template()}
    <div class="flex h-48 w-full items-center justify-center gap-12">
      <CompactLoader label="Loading" />
      <CompactLoader size="sm" label="Loading" />
    </div>
  {/snippet}
</Story>

<Story name="CompactLoader in a panel">
  {#snippet template()}
    <div class="mx-auto flex h-56 w-full max-w-sm items-center justify-center rounded-xl border">
      <CompactLoader label="Loading" />
    </div>
  {/snippet}
</Story>
