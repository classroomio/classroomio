<script lang="ts">
  import { SlideEmbedCard, SlideEmbedFrame, SlideEmbedPicker, type SlideEmbed } from '@cio/ui';
  import { SLIDE_PLATFORM_BY_ID } from '@cio/utils/functions';
  import * as Item from '@cio/ui/base/item';
  import { Button } from '@cio/ui/base/button';
  import { Empty } from '@cio/ui/custom/empty';
  import PresentationIcon from '@lucide/svelte/icons/presentation';

  let slides = $state<SlideEmbed[]>([]);
  let pickerOpen = $state(false);

  const cardLabels = {
    remove: 'Remove slide',
    menuAria: 'Slide actions'
  };

  function addSlide(slide: SlideEmbed) {
    slides = [...slides, slide];
    pickerOpen = false;
  }

  function removeSlide(slideId: string) {
    slides = slides.filter((slide) => slide.id !== slideId);
  }
</script>

<div class="ui:flex ui:w-full ui:max-w-4xl ui:flex-col ui:gap-4">
  {#if pickerOpen}
    <div class="ui:h-[560px] ui:min-h-0 ui:w-full">
      <SlideEmbedPicker onAdd={addSlide} />
    </div>
    <Button variant="outline" class="ui:self-start" onclick={() => (pickerOpen = false)}>Cancel</Button>
  {:else}
    <Button class="ui:self-end" onclick={() => (pickerOpen = true)}>Add slide</Button>

    {#if slides.length}
      <Item.Group class="ui:grid! ui:w-full ui:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] ui:gap-x-5 ui:gap-y-8">
        {#each slides as slide (slide.id)}
          <SlideEmbedCard {slide} labels={cardLabels} isEditMode={true} onRemove={() => removeSlide(slide.id)} />
        {/each}
      </Item.Group>
    {:else}
      <Empty
        title="No slides yet"
        description="Embed Google Slides, Canva, PowerPoint, Keynote, Figma, Prezi, Pitch, Gamma, SlideShare, or Beautiful.ai"
        icon={PresentationIcon}
      />
    {/if}
  {/if}

  {#if slides.length && !pickerOpen}
    <div class="ui:flex ui:flex-col ui:gap-5">
      <p class="ui:text-muted-foreground ui:text-sm">Learner view</p>
      {#each slides as slide (slide.id)}
        <SlideEmbedFrame src={slide.src} title={SLIDE_PLATFORM_BY_ID[slide.platform].name} />
      {/each}
    </div>
  {/if}
</div>
