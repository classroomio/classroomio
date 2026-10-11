<script lang="ts">
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import { Button } from '@cio/ui/base/button';
  import * as Dialog from '@cio/ui/base/dialog';
  import { CUSTOMER_STORY } from '$lib/utils/customer-story';
  import NotchCard from './ui/notch-card.svelte';
  import Section from './ui/section.svelte';
  import SectionHeader from './ui/section-header.svelte';

  const story = CUSTOMER_STORY;

  let isOpen = $state(false);
</script>

<Section id="customer-stories" class="bg-gray-50 pt-8 md:pt-12 xl:pt-16 xl:pb-0">
  <SectionHeader
    eyebrow={story.eyebrow}
    eyebrowClass="text-blue-700"
    lede={story.subtitle}
    ledeClass="text-gray-700"
    titleClass="text-gray-950 text-[clamp(34px,4vw,56px)]! font-bold! tracking-[-0.05em]!"
  >
    {#snippet title()}{story.heading}{/snippet}
  </SectionHeader>

  <div class="mt-12 grid items-stretch gap-4 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)]">
    <Dialog.Root bind:open={isOpen}>
      <div class="relative">
        <span class="hidden aspect-video lg:block" aria-hidden="true"></span>
        <Dialog.Trigger
          aria-label={story.playAriaLabel}
          class="group relative flex w-full cursor-pointer flex-col overflow-hidden rounded-md bg-gray-950 text-left focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 focus-visible:outline-none lg:absolute lg:inset-0 lg:block"
        >
          <span class="relative block aspect-video w-full lg:absolute lg:inset-0 lg:aspect-auto">
            <img
              src={story.posterUrl}
              alt={story.posterAlt}
              width="1280"
              height="720"
              loading="lazy"
              decoding="async"
              class="absolute inset-0 size-full object-cover"
            />

            <span class="absolute top-3 left-3 flex flex-wrap items-center gap-2 md:top-6 md:left-6">
              <span
                class="inline-flex items-center gap-1.5 rounded-full bg-gray-800/85 px-3 py-1.5 font-mono text-xs font-medium text-white"
              >
                <svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
                  <path d="M2 1l7 4-7 4z" />
                </svg>
                {story.videoDuration}
              </span>
              <span class="rounded-full bg-white px-3 py-1.5 font-mono text-xs font-medium text-blue-700">
                {story.videoLabel}
              </span>
            </span>

            <span class="absolute inset-0 flex items-center justify-center" aria-hidden="true">
              <span
                class="ease-out-soft flex size-16 items-center justify-center rounded-full bg-white motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-110 md:size-[86px]"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="#0233BD" class="ml-1">
                  <path d="M6 3.5v17l14-8.5z" />
                </svg>
              </span>
            </span>
          </span>

          <span
            class="relative block bg-gray-950 px-5 py-4 md:px-8 lg:absolute lg:inset-x-0 lg:bottom-0 lg:bg-transparent lg:bg-gradient-to-t lg:from-black/85 lg:via-black/55 lg:to-transparent lg:pt-28 lg:pb-6"
          >
            <span class="block text-lg leading-snug font-bold text-white md:text-2xl">{story.quote}</span>
            <span class="mt-3 flex items-center justify-between gap-4 text-sm text-white/85">
              <span>{story.speakerName} · {story.speakerRole}</span>
              <span class="inline-flex shrink-0 items-center gap-1.5 font-semibold text-white">
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
        <span
          aria-hidden="true"
          class="cio-notch pointer-events-none absolute -top-px left-6 z-[4] h-[11px] w-[46px] bg-gray-50"
        ></span>
      </div>

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
          poster={story.posterUrl}
          controls
          autoplay
          playsinline
          preload="metadata"
          class="aspect-video w-full bg-black"
        ></video>
      </Dialog.Content>
    </Dialog.Root>

    <NotchCard class="h-full bg-[#EEF2FF] text-gray-950" notchClass="bg-gray-50">
      <span class="inline-flex w-fit items-center rounded-md bg-[#0D203B] px-3 py-2">
        <img src={story.logoUrl} alt={story.logoAlt} width="244" height="55" class="block h-7 w-auto" />
      </span>

      <h3 class="mt-4 text-xl leading-snug font-medium">{story.cardHeading}</h3>
      <p class="mt-2.5 text-[13.5px] leading-relaxed text-gray-700">{story.cardBody}</p>

      <div class="mt-auto grid grid-cols-2 gap-2 pt-6">
        {#each story.stats as stat (stat.value)}
          <div class="rounded-md bg-white px-4 py-3.5">
            <p class="text-base leading-tight font-medium md:text-lg">{stat.value}</p>
            <p class="mt-1 text-[13px] leading-snug text-gray-600">{stat.label}</p>
          </div>
        {/each}
      </div>

      <div class="mt-4">
        <Button href={story.ctaHref} size="sm">
          {story.ctaLabel}
          <ArrowRightIcon />
        </Button>
      </div>
    </NotchCard>
  </div>
</Section>
