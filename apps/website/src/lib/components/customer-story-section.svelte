<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
  import { CUSTOMER_STORY } from '$lib/utils/customer-story';
  import CtaButton from './ui/cta-button.svelte';
  import Eyebrow from './ui/eyebrow.svelte';
  import NotchCard from './ui/notch-card.svelte';
  import Section from './ui/section.svelte';
  import SectionHeader from './ui/section-header.svelte';

  const story = CUSTOMER_STORY;

  let isOpen = $state(false);
</script>

<Section id="customer-stories" class="bg-white pt-8 md:pt-12 xl:pt-16 xl:pb-0">
  <SectionHeader eyebrow={story.eyebrow} eyebrowClass="text-blue-700" lede={story.subtitle} ledeClass="text-gray-500">
    {#snippet title()}{story.heading}{/snippet}
  </SectionHeader>

  <div class="mt-12 grid items-stretch gap-6 lg:grid-cols-[1.65fr_1fr]">
    <Dialog.Root bind:open={isOpen}>
      <Dialog.Trigger
        aria-label={story.playAriaLabel}
        class="group relative flex w-full cursor-pointer flex-col overflow-hidden rounded-xl bg-gray-950 text-left focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 focus-visible:outline-none lg:block lg:h-full lg:min-h-[420px]"
      >
        <span class="relative block aspect-video w-full lg:absolute lg:inset-0 lg:aspect-auto">
          <img
            src={story.thumbnailUrl}
            alt={story.thumbnailAlt}
            width="1920"
            height="1080"
            loading="lazy"
            decoding="async"
            class="ease-out-soft absolute inset-0 size-full object-cover object-left motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-[1.02]"
          />

          <span class="absolute top-3 left-3 flex flex-wrap items-center gap-2 md:top-5 md:left-5">
            <span
              class="inline-flex items-center gap-1.5 rounded-full bg-gray-950/80 px-3 py-1.5 text-xs font-medium text-white"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
                <path d="M2 1l7 4-7 4z" />
              </svg>
              {story.videoDuration}
            </span>
            <span class="text-tag rounded-full bg-white px-3 py-1.5 font-mono font-medium text-blue-700 uppercase">
              {story.videoLabel}
            </span>
          </span>

          <span class="absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <span
              class="ease-out-soft flex size-16 items-center justify-center rounded-full bg-white motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-110 md:size-20"
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="#0233BD" class="ml-1">
                <path d="M6 3.5v17l14-8.5z" />
              </svg>
            </span>
          </span>
        </span>

        <span
          class="relative block bg-gray-950 px-5 py-4 md:px-7 lg:absolute lg:inset-x-0 lg:bottom-0 lg:bg-transparent lg:bg-gradient-to-t lg:from-black/90 lg:via-black/65 lg:to-transparent lg:pt-24 lg:pb-6"
        >
          <span class="block max-w-[34ch] text-xl leading-snug font-bold text-balance text-white md:text-2xl">
            {story.quote}
          </span>
          <span class="mt-3 flex items-center justify-between gap-4 text-sm text-white/80">
            <span>{story.speakerName} · {story.speakerRole}</span>
            <span class="inline-flex shrink-0 items-center gap-1.5 font-medium text-white">
              {story.watchLabel}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
                class="ease-out-soft motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </span>
        </span>
      </Dialog.Trigger>

      <Dialog.Content
        showCloseButton={false}
        class="w-[min(94vw,1120px)] max-w-none gap-0 overflow-hidden border-0 bg-black p-0 sm:max-w-none md:max-w-none md:min-w-0"
      >
        <Dialog.Close
          aria-label={story.closeLabel}
          class="absolute top-3 right-3 z-10 flex size-9 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </Dialog.Close>
        <Dialog.Title class="sr-only">{story.videoDialogTitle}</Dialog.Title>
        <Dialog.Description class="sr-only">{story.subtitle}</Dialog.Description>
        <!-- svelte-ignore a11y_media_has_caption -->
        <video
          src={story.videoUrl}
          poster={story.thumbnailUrl}
          controls
          autoplay
          playsinline
          preload="metadata"
          class="aspect-video w-full bg-black"
        ></video>
      </Dialog.Content>
    </Dialog.Root>

    <NotchCard class="h-full bg-[#EEF2FF] text-gray-950" notchClass="bg-white">
      <span class="inline-flex w-fit items-center rounded-md bg-[#0D203B] px-3 py-2">
        <img src={story.logoUrl} alt={story.logoAlt} width="340" height="70" class="block h-6 w-auto" />
      </span>

      <h3 class="text-h4 mt-5 font-semibold text-balance">{story.cardHeading}</h3>
      <p class="mt-3 text-[15px] leading-relaxed text-gray-600">{story.cardBody}</p>

      <div class="mt-6 grid grid-cols-2 gap-3">
        {#each story.stats as stat (stat.value)}
          <div class="rounded-lg bg-white p-4">
            <p class="text-card-title leading-tight font-semibold">{stat.value}</p>
            <p class="mt-1 text-sm leading-snug text-gray-600">{stat.label}</p>
          </div>
        {/each}
      </div>
      <Eyebrow size="sm" class="mt-3 text-gray-500 normal-case">{story.statsCaption}</Eyebrow>

      <div class="mt-auto pt-8">
        <CtaButton href={story.ctaHref} arrow size="lg" class="w-full sm:w-auto">{story.ctaLabel}</CtaButton>
      </div>
    </NotchCard>
  </div>
</Section>
