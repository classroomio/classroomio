<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { CoachMark } from '@cio/ui/custom/coach-mark';
  import CoachMarkDemo from './coach-mark-demo.svelte';
  import { FIELDS } from './fields';

  const TITLE = '🎉 New! Lessons are now flexible.';
  const DESCRIPTION =
    'Build each lesson from note, video, slides, document and image blocks, in any order. Select Edit to try it.';

  const { Story } = defineMeta({
    title: 'Molecules/CoachMark',
    component: CoachMark,
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    argTypes: {
      onAction: { control: false },
      onDismiss: { control: false },
      actionIcon: { control: false }
    },
    tags: ['autodocs']
  });
</script>

<Story name="WithAction">
  {#snippet template()}
    <CoachMarkDemo title={TITLE} description={DESCRIPTION} dismissLabel="Got it" actionLabel="Watch video" showIcon />
  {/snippet}
</Story>

<Story name="ActionWithoutIcon">
  {#snippet template()}
    <CoachMarkDemo title={TITLE} description={DESCRIPTION} dismissLabel="Got it" actionLabel="Learn more" />
  {/snippet}
</Story>

<Story name="DismissOnly">
  {#snippet template()}
    <CoachMarkDemo title={TITLE} description={DESCRIPTION} dismissLabel="Got it" />
  {/snippet}
</Story>

<Story name="TitleOnly">
  {#snippet template()}
    <CoachMarkDemo title="Drag blocks to reorder them." dismissLabel="Got it" />
  {/snippet}
</Story>

<Story name="AlignedToStart">
  {#snippet template()}
    <CoachMarkDemo
      title={TITLE}
      description={DESCRIPTION}
      dismissLabel="Got it"
      actionLabel="Watch video"
      align="start"
      showIcon
    />
  {/snippet}
</Story>

<Story name="ShownOnce">
  {#snippet template()}
    <CoachMarkDemo
      title="This tip is remembered."
      description="After you dismiss it, it stays hidden on reload. Select Show again to clear the stored flag."
      dismissLabel="Got it"
      actionLabel="Watch video"
      storageKey="storybook:coach-mark-shown-once"
    />
  {/snippet}
</Story>
