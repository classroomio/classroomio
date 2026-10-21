<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { SlideEmbedCard, SlideEmbedFrame, SlideEmbedPicker, type SlideEmbed } from '@cio/ui';
  import { SLIDE_PLATFORM_BY_ID } from '@cio/utils/functions';
  import SlideEmbedPlayground from './slide-embed-playground.svelte';

  const sampleSlide = {
    id: 'sample-canva',
    platform: 'canva',
    src: 'https://www.canva.com/design/DAFDemoDesignId/view?embed'
  } satisfies SlideEmbed;

  const sampleSlides = [
    sampleSlide,
    {
      id: 'sample-google',
      platform: 'google-slides',
      src: 'https://docs.google.com/presentation/d/e/2PACX-1vTDemoPresentationId/embed?start=false&loop=false&delayms=3000'
    },
    {
      id: 'sample-figma',
      platform: 'figma',
      src: 'https://embed.figma.com/slides/DemoFileKey123?embed-host=classroomio'
    }
  ] satisfies SlideEmbed[];

  const cardLabels = {
    remove: 'Remove slide',
    menuAria: 'Slide actions'
  };

  const { Story } = defineMeta({
    title: 'Molecules/SlideEmbed',
    component: SlideEmbedPicker,
    parameters: {
      layout: 'padded',
      docs: {
        description: {
          component:
            'Guided slide embed picker, added-embed cards (video-style), and a consistent 16:9 iframe frame. Paste a full iframe; width and height from the snippet are ignored.'
        }
      }
    },
    tags: ['autodocs']
  });
</script>

<Story name="Picker">
  {#snippet template()}
    <div class="ui:h-[560px] ui:w-full ui:max-w-4xl">
      <SlideEmbedPicker onAdd={(slide) => console.log('add', slide)} />
    </div>
  {/snippet}
</Story>

<Story name="AddedCard">
  {#snippet template()}
    <div class="ui:w-[240px]">
      <SlideEmbedCard
        slide={sampleSlide}
        labels={cardLabels}
        isEditMode={true}
        onRemove={() => console.log('remove')}
      />
    </div>
  {/snippet}
</Story>

<Story name="EditGrid">
  {#snippet template()}
    <div
      class="ui:grid ui:w-full ui:max-w-4xl ui:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] ui:gap-x-5 ui:gap-y-8"
    >
      {#each sampleSlides as slide (slide.id)}
        <SlideEmbedCard
          {slide}
          labels={cardLabels}
          isEditMode={true}
          onRemove={() => console.log('remove', slide.id)}
        />
      {/each}
    </div>
  {/snippet}
</Story>

<Story name="ViewFrames">
  {#snippet template()}
    <div class="ui:flex ui:w-full ui:max-w-3xl ui:flex-col ui:gap-5">
      {#each sampleSlides as slide (slide.id)}
        <SlideEmbedFrame src={slide.src} title={SLIDE_PLATFORM_BY_ID[slide.platform].name} />
      {/each}
    </div>
  {/snippet}
</Story>

<Story name="LessonTabPlayground">
  {#snippet template()}
    <SlideEmbedPlayground />
  {/snippet}
</Story>
