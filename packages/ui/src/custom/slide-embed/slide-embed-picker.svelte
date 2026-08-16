<script lang="ts">
  import {
    createSlideEmbed,
    parseSlideEmbed,
    SLIDE_PLATFORMS,
    type SlideEmbed,
    type SlidePlatformId
  } from '@cio/utils/functions';
  import CheckIcon from '@lucide/svelte/icons/check';
  import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
  import SearchIcon from '@lucide/svelte/icons/search';
  import { Button } from '../../base/button';
  import { Input } from '../../base/input';
  import { TextareaField } from '../textarea-field';
  import { cn } from '../../tools';
  import { DEFAULT_SLIDE_EMBED_PICKER_LABELS } from './default-labels';
  import SlideEmbedFrame from './slide-embed-frame.svelte';
  import SlidePlatformIcon from './slide-platform-icon.svelte';
  import type { SlideEmbedPickerLabels } from './types';

  const DEFAULT_DOCS_BASE_URL = 'https://classroomio.com/docs/guides/embed-slides';

  interface Props {
    labels?: SlideEmbedPickerLabels;
    docsBaseUrl?: string;
    onAdd?: (slide: SlideEmbed) => void;
    class?: string;
  }

  let {
    labels = DEFAULT_SLIDE_EMBED_PICKER_LABELS,
    docsBaseUrl = DEFAULT_DOCS_BASE_URL,
    onAdd,
    class: className = ''
  }: Props = $props();

  let query = $state('');
  let selectedId = $state<SlidePlatformId | null>(null);
  let rawEmbed = $state('');

  const filteredPlatforms = $derived(
    SLIDE_PLATFORMS.filter((platform) => platform.name.toLowerCase().includes(query.trim().toLowerCase()))
  );

  const selectedPlatform = $derived(
    selectedId ? (SLIDE_PLATFORMS.find((platform) => platform.id === selectedId) ?? null) : null
  );

  const parseResult = $derived(rawEmbed.trim() ? parseSlideEmbed(rawEmbed) : null);

  const previewSlide = $derived.by(() => {
    if (!parseResult?.ok) return null;

    if (selectedId && parseResult.platform !== selectedId) return null;

    return createSlideEmbed(rawEmbed, 'preview');
  });

  const errorMessage = $derived.by(() => {
    if (!rawEmbed.trim() || !parseResult || parseResult.ok) {
      if (parseResult?.ok && selectedId && parseResult.platform !== selectedId) {
        return labels.invalidEmbed;
      }

      return '';
    }

    return parseResult.reason === 'unsupported' ? labels.unsupportedPlatform : labels.invalidEmbed;
  });

  function selectPlatform(platformId: SlidePlatformId) {
    selectedId = platformId;
    rawEmbed = '';
  }

  function addEmbed() {
    const slide = createSlideEmbed(rawEmbed);

    if (!slide) return;

    if (selectedId && slide.platform !== selectedId) return;

    onAdd?.(slide);
    rawEmbed = '';
  }
</script>

<div
  class={cn(
    'ui:flex ui:h-full ui:min-h-[360px] ui:w-full ui:min-w-0 ui:flex-col ui:overflow-hidden ui:rounded-xl ui:border ui:border-border ui:bg-background ui:md:flex-row',
    className
  )}
>
  <div
    class="ui:flex ui:min-h-0 ui:w-full ui:shrink-0 ui:flex-col ui:gap-2 ui:border-b ui:border-border ui:bg-muted/40 ui:p-3 ui:md:w-56 ui:md:border-r ui:md:border-b-0"
  >
    <div class="ui:flex ui:items-center ui:gap-2 ui:rounded-md ui:border ui:border-input ui:bg-background ui:px-2">
      <SearchIcon class="ui:text-muted-foreground ui:size-4 ui:shrink-0" aria-hidden="true" />
      <Input
        type="search"
        class="ui:h-8 ui:border-0 ui:bg-transparent ui:px-0 ui:shadow-none ui:focus-visible:ring-0"
        placeholder={labels.searchPlaceholder}
        aria-label={labels.searchPlaceholder}
        autocomplete="off"
        bind:value={query}
      />
    </div>

    <nav
      class="ui:flex ui:max-h-72 ui:min-h-0 ui:flex-col ui:gap-0.5 ui:overflow-auto ui:md:max-h-none ui:md:flex-1"
      aria-label="Slide platforms"
    >
      {#each filteredPlatforms as platform (platform.id)}
        {@const isActive = platform.id === selectedId}

        <button
          type="button"
          class={cn(
            'ui:flex ui:w-full ui:cursor-pointer ui:items-center ui:gap-2.5 ui:rounded-md ui:px-2 ui:py-1.5 ui:text-left ui:text-sm',
            isActive ? 'ui:bg-secondary ui:text-secondary-foreground' : 'ui:text-foreground ui:hover:bg-muted/60'
          )}
          aria-pressed={isActive}
          onclick={() => selectPlatform(platform.id)}
        >
          <SlidePlatformIcon platform={platform.id} class="ui:size-7" />
          <span class="ui:leading-tight">{platform.name}</span>
        </button>
      {/each}
    </nav>
  </div>

  <div class="ui:flex ui:min-h-0 ui:min-w-0 ui:flex-1 ui:flex-col ui:gap-4 ui:overflow-auto ui:p-4 ui:sm:p-6">
    {#if !selectedPlatform}
      <div
        class="ui:text-muted-foreground ui:flex ui:flex-1 ui:items-center ui:justify-center ui:text-center ui:text-sm"
      >
        {labels.emptyPrompt}
      </div>
    {:else}
      {@const platformCopy = labels.platforms[selectedPlatform.id]}

      <div class="ui:flex ui:items-center ui:gap-3">
        <SlidePlatformIcon platform={selectedPlatform.id} class="ui:size-10" />
        <div>
          <p class="ui:text-base ui:font-semibold">{selectedPlatform.name}</p>
          <p class="ui:text-muted-foreground ui:text-xs">{platformCopy.hint}</p>
        </div>
      </div>

      <ol class="ui:m-0 ui:flex ui:list-none ui:flex-col ui:gap-2 ui:p-0">
        {#each platformCopy.steps as step, stepIndex (step)}
          <li class="ui:flex ui:gap-2.5 ui:text-sm">
            <span
              class="ui:bg-foreground ui:text-background ui:mt-0.5 ui:flex ui:size-5 ui:shrink-0 ui:items-center ui:justify-center ui:rounded-full ui:text-[11px] ui:font-semibold"
            >
              {stepIndex + 1}
            </span>
            <span class="ui:text-muted-foreground">{step}</span>
          </li>
        {/each}
      </ol>

      <TextareaField
        label={labels.embedCodeLabel}
        placeholder={labels.embedCodePlaceholder}
        {errorMessage}
        bind:value={rawEmbed}
        rows={4}
      />

      <div class="ui:flex ui:flex-wrap ui:items-center ui:gap-2">
        <Button type="button" disabled={!previewSlide} onclick={addEmbed}>{labels.addEmbed}</Button>
        <Button
          variant="outline"
          size="sm"
          href="{docsBaseUrl}#{selectedPlatform.docsHash}"
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLinkIcon class="ui:size-4" aria-hidden="true" />
          {labels.howToEmbed}
          {selectedPlatform.name}
        </Button>
      </div>

      <div>
        <p class="ui:mb-2 ui:text-sm ui:font-medium">{labels.previewLabel}</p>
        {#if previewSlide}
          <div class="ui:flex ui:flex-col ui:gap-2">
            <p class="ui:text-green-600 ui:flex ui:items-center ui:gap-1.5 ui:text-xs ui:font-semibold">
              <CheckIcon class="ui:size-3.5" aria-hidden="true" />
              {labels.embedReady}
            </p>
            <SlideEmbedFrame src={previewSlide.src} title={selectedPlatform.name} />
          </div>
        {:else}
          <div
            class="ui:bg-muted ui:text-muted-foreground ui:flex ui:aspect-video ui:items-center ui:justify-center ui:rounded-md ui:border ui:border-dashed ui:text-sm"
          >
            {labels.embedCodePlaceholder}
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>
