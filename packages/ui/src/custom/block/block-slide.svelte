<script lang="ts">
  import { SLIDE_PLATFORM_BY_ID } from '@cio/utils/functions';
  import { SlideEmbedFrame, type SlideEmbed } from '../slide-embed';
  import ChangeButton from './block-change-button.svelte';

  interface Props {
    slide?: SlideEmbed;
    isExample?: boolean;
    editable?: boolean;
    frameTitle?: string;
    changeLabel?: string;
    sampleBrand?: string;
    sampleHeadline?: string[];
    sampleUpdated?: string;
    onChange?: () => void;
  }

  let {
    slide,
    isExample = false,
    editable = false,
    frameTitle = '',
    changeLabel,
    sampleBrand = 'ClassroomIO',
    sampleHeadline = ['Customer Onboarding', 'Playbook'],
    sampleUpdated = '',
    onChange
  }: Props = $props();

  const platformName = $derived(slide ? (SLIDE_PLATFORM_BY_ID[slide.platform]?.name ?? 'Slide') : '');
  const hostLabel = $derived.by(() => {
    if (!slide) return '';

    try {
      return new URL(slide.src).hostname.replace(/^www\./, '');
    } catch {
      return platformName;
    }
  });
</script>

{#if isExample}
  <div class="ui:group/slide ui:relative ui:w-full ui:overflow-hidden ui:rounded-lg">
    <div class="lesson-slide-sample">
      <div class="sample-row">
        <span class="sample-mark"></span>
        <span class="sample-brand">{sampleBrand}</span>
        <span class="sample-rule"></span>
      </div>
      <div class="sample-headline">
        {#each sampleHeadline as line (line)}
          <span class="sample-line">{line}</span>
        {/each}
      </div>
      <div class="sample-row">
        <span class="sample-rule short"></span>
        {#if sampleUpdated}
          <span class="sample-badge">{sampleUpdated}</span>
        {/if}
      </div>
    </div>
    {#if editable && changeLabel && onChange}
      <ChangeButton
        label={changeLabel}
        onclick={onChange}
        class="ui:absolute ui:top-2 ui:right-2 ui:z-10 ui:opacity-0 ui:transition ui:group-hover/slide:opacity-100 ui:focus-visible:opacity-100"
      />
    {/if}
  </div>
{:else if slide}
  <div class="ui:w-full ui:min-w-0">
    <div class="ui:group/slide ui:relative ui:w-full ui:overflow-hidden ui:rounded-lg">
      <SlideEmbedFrame src={slide.src} title={frameTitle} />
      {#if editable && changeLabel && onChange}
        <ChangeButton
          label={changeLabel}
          onclick={onChange}
          class="ui:absolute ui:top-2 ui:right-2 ui:z-10 ui:opacity-100 ui:transition ui:focus-within:opacity-100 ui:focus-visible:opacity-100 ui:sm:opacity-0 ui:sm:group-hover/slide:opacity-100"
        />
      {/if}
    </div>
    {#if editable}
      <div class="ui:mt-3 ui:min-w-0 ui:px-3 ui:py-3">
        <p
          class="ui:text-foreground ui:line-clamp-2 ui:min-w-0 ui:text-base ui:leading-snug ui:font-semibold ui:break-words"
        >
          {platformName}
        </p>
        <p class="ui:text-muted-foreground ui:mt-0.5 ui:line-clamp-1 ui:text-sm ui:leading-snug">{hostLabel}</p>
      </div>
    {/if}
  </div>
{/if}

<style>
  .lesson-slide-sample {
    container-type: inline-size;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 100%;
    aspect-ratio: 16 / 9;
    padding: 6.5% 7%;
    overflow: hidden;
    color: #fff;
    text-align: left;
    background:
      radial-gradient(ellipse 70% 55% at 76% 0%, rgba(91, 123, 255, 0.5), transparent 60%),
      radial-gradient(ellipse 65% 55% at 6% 100%, rgba(147, 90, 255, 0.55), transparent 62%),
      linear-gradient(160deg, #0b0c14, #07070b 60%);
    border-radius: 8px;
  }

  .sample-row {
    display: flex;
    align-items: center;
    gap: 1.6cqw;
  }

  .sample-mark {
    flex-shrink: 0;
    width: 3.4cqw;
    height: 3.4cqw;
    border-radius: 0.9cqw;
    background: linear-gradient(135deg, #6d8dff, #9b6dff);
  }

  .sample-brand {
    font-size: 1.7cqw;
    font-weight: 600;
    white-space: nowrap;
  }

  .sample-rule {
    flex: 1;
    height: 2.9cqw;
    border: 1px solid rgba(255, 255, 255, 0.22);
    border-radius: 999px;
  }

  .sample-rule.short {
    flex: none;
    width: 48%;
  }

  .sample-headline {
    display: flex;
    flex-direction: column;
    gap: 0.1em;
    font-size: 6.2cqw;
    font-weight: 700;
    line-height: 1.08;
    letter-spacing: -0.03em;
  }

  .sample-line {
    display: block;
  }

  .sample-badge {
    flex-shrink: 0;
    padding: 0.55em 1.3em;
    font-size: 1.5cqw;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.82);
    white-space: nowrap;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.22);
    border-radius: 999px;
  }
</style>
