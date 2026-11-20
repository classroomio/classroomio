<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { VideoGuideButton, VideoGuideCard } from '@cio/ui/custom/video-guide';
  import VideoGuideDialogDemo from './video-guide-dialog-demo.svelte';
  import { FIELDS } from './fields';

  const VIDEO_ID = '9hpGCqzypLk';
  const TITLE = 'Introducing lesson blocks';
  const DESCRIPTION = 'Lessons are now built from blocks. See how it works in 5 minutes.';
  const CARD_ARGS = {
    videoId: VIDEO_ID,
    title: TITLE,
    description: DESCRIPTION,
    badgeLabel: 'New',
    actionLabel: 'Watch video',
    closeLabel: 'Close'
  };

  const { Story } = defineMeta({
    title: 'Molecules/VideoGuide',
    component: VideoGuideCard,
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    tags: ['autodocs']
  });
</script>

<Story name="Card" args={CARD_ARGS}>
  {#snippet template(args)}
    <div class="w-112 max-w-full">
      <VideoGuideCard {...args} />
    </div>
  {/snippet}
</Story>

<Story name="CardWithoutLabels" args={{ videoId: VIDEO_ID, title: TITLE, description: DESCRIPTION }}>
  {#snippet template(args)}
    <div class="w-112 max-w-full">
      <VideoGuideCard {...args} />
    </div>
  {/snippet}
</Story>

<Story
  name="CardLongDescription"
  args={{
    ...CARD_ARGS,
    description:
      'Build each lesson from note, video, slides, document and image blocks, reorder them by dragging, and ask the Assistant to update any block for you.'
  }}
>
  {#snippet template(args)}
    <div class="w-112 max-w-full">
      <VideoGuideCard {...args} />
    </div>
  {/snippet}
</Story>

<Story name="CardNarrow" args={CARD_ARGS}>
  {#snippet template(args)}
    <div class="w-72">
      <VideoGuideCard {...args} />
    </div>
  {/snippet}
</Story>

<Story name="CardLeftAligned" args={CARD_ARGS}>
  {#snippet template(args)}
    <div class="w-160 max-w-full border border-dashed p-4">
      <VideoGuideCard {...args} align="start" />
    </div>
  {/snippet}
</Story>

<Story name="CardWithDialogOpen" args={{ ...CARD_ARGS, open: true }}>
  {#snippet template(args)}
    <div class="w-112 max-w-full">
      <VideoGuideCard {...args} />
    </div>
  {/snippet}
</Story>

<Story name="Button">
  {#snippet template()}
    <VideoGuideButton videoId={VIDEO_ID} title={TITLE} label="Watch video" closeLabel="Close" />
  {/snippet}
</Story>

<Story name="ButtonVariants">
  {#snippet template()}
    <div class="flex flex-wrap items-center gap-3">
      <VideoGuideButton videoId={VIDEO_ID} title={TITLE} label="Outline" />
      <VideoGuideButton videoId={VIDEO_ID} title={TITLE} label="Secondary" variant="secondary" />
      <VideoGuideButton videoId={VIDEO_ID} title={TITLE} label="Default" variant="default" />
      <VideoGuideButton videoId={VIDEO_ID} title={TITLE} label="Small" size="sm" />
    </div>
  {/snippet}
</Story>

<Story name="DialogClosed">
  {#snippet template()}
    <VideoGuideDialogDemo videoId={VIDEO_ID} title={TITLE} closeLabel="Close" />
  {/snippet}
</Story>

<Story name="DialogOpen">
  {#snippet template()}
    <VideoGuideDialogDemo videoId={VIDEO_ID} title={TITLE} closeLabel="Close" initiallyOpen />
  {/snippet}
</Story>

<Story name="DialogLongTitle">
  {#snippet template()}
    <VideoGuideDialogDemo
      videoId={VIDEO_ID}
      title="Introducing lesson blocks: build every lesson from notes, videos, slides, documents and images in any order you choose"
      closeLabel="Close"
      initiallyOpen
    />
  {/snippet}
</Story>
