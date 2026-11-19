<script lang="ts">
  import XIcon from '@lucide/svelte/icons/x';
  import { getExerciseQuestionLabel, type ExerciseQuestionLabels } from '@cio/question-types';
  import { IconButton } from '../../icon-button';
  import { ImageLightbox, ZoomableImage } from '../../image-lightbox';
  import { getQuestionLightboxLabels } from '../lightbox-labels';

  let {
    src,
    alt,
    variant = 'preview',
    labels,
    onRemove,
    disabled = false,
    removeTooltip = '',
    removeSr = 'Remove image',
    hasAnyImageInOptions = false
  }: {
    src: string | null;
    alt: string;
    variant?: 'preview' | 'take' | 'edit';
    labels?: ExerciseQuestionLabels;
    onRemove?: () => void;
    disabled?: boolean;
    removeTooltip?: string;
    removeSr?: string;
    hasAnyImageInOptions?: boolean;
  } = $props();

  let isLightboxOpen = $state(false);
</script>

{#if variant === 'edit'}
  {#if src}
    <div class="ui:group ui:relative ui:h-24 ui:w-24 ui:rounded-md ui:border">
      <div class="ui:absolute ui:inset-0 ui:overflow-hidden ui:rounded-md">
        <img {src} {alt} class="ui:h-full ui:w-full ui:object-cover" />
      </div>
      {#if onRemove}
        <IconButton
          {disabled}
          tooltipClass="ui:absolute ui:right-[-12px] ui:top-[-12px] ui:z-10"
          class="ui:opacity-0 ui:transition-opacity ui:group-hover:opacity-100"
          tooltip={removeTooltip}
          onclick={onRemove}
          size="icon-sm"
        >
          <XIcon />
          <span class="ui:sr-only">{removeSr}</span>
        </IconButton>
      {/if}
    </div>
  {/if}
{:else if hasAnyImageInOptions}
  {#if src}
    <ZoomableImage
      {src}
      {alt}
      enlargeLabel={getExerciseQuestionLabel(labels, 'question.media.enlarge_image', 'Click to enlarge')}
      class="ui:aspect-video"
      onclick={() => (isLightboxOpen = true)}
    />
    <ImageLightbox images={[{ src, alt }]} labels={getQuestionLightboxLabels(labels)} bind:open={isLightboxOpen} />
  {:else}
    <div class="ui:aspect-video ui:w-full ui:rounded-md ui:border ui:bg-muted"></div>
  {/if}
{/if}
