<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import * as Block from '@cio/ui/custom/block';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Blocks/VideoBlock',
    component: Block.Video,
    args: {
      title: 'Self Hosting ClassroomIO: An introduction to the Dashboard',
      thumbnailUrl: '/images/classroomio-course-img-template.jpg',
      durationLabel: '4:12',
      channelLine: 'Modern Web Development with React',
      metaLine: 'YouTube · Oct 27, 2026',
      editable: true,
      changeLabel: 'Change video'
    },
    parameters: {
      layout: 'padded',
      controls: {
        include: FIELDS
      }
    },
    argTypes: {
      actions: { control: false },
      status: { control: false },
      notice: { control: false },
      player: { control: false },
      onChange: { control: false }
    },
    tags: ['autodocs']
  });
</script>

<Story name="View">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl">
      <Block.Video {...args} editable={false} />
    </div>
  {/snippet}
</Story>

<Story name="Edit">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl">
      <Block.Video {...args} editable={true} onChange={() => console.log('change video')}>
        {#snippet actions()}
          <button
            type="button"
            class="ui:text-muted-foreground ui:hover:bg-muted ui:hover:text-foreground flex size-7 shrink-0 items-center justify-center rounded-md"
            aria-label="Video options"
          >
            <EllipsisVerticalIcon size={16} />
          </button>
        {/snippet}
        {#snippet status()}
          <span class="ui:bg-muted ui:text-muted-foreground rounded-full px-2 py-0.5 text-[10px] font-semibold">
            HLS ready
          </span>
        {/snippet}
        {#snippet notice()}
          <p class="mt-0.5 text-sm leading-snug text-orange-500">Transcription in progress…</p>
        {/snippet}
      </Block.Video>
    </div>
  {/snippet}
</Story>

<Story name="ChangeAction">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl">
      <Block.Video
        {...args}
        editable={true}
        onChange={() => console.log('change video')}
        title="Hover to change the video"
      />
    </div>
  {/snippet}
</Story>

<Story name="NoThumbnail">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl">
      <Block.Video {...args} thumbnailUrl={undefined} editable={false} />
    </div>
  {/snippet}
</Story>

<Story name="Player">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl">
      <Block.Video {...args} editable={false}>
        {#snippet player()}
          <div class="ui:bg-muted flex aspect-video w-full items-center justify-center rounded-lg">
            <span class="ui:text-muted-foreground text-sm">Injected video player</span>
          </div>
        {/snippet}
      </Block.Video>
    </div>
  {/snippet}
</Story>
