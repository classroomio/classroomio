<script>
  import { BlurFade } from '@cio/ui/custom/animation/blurfade';
  import { BotIcon, BotOffIcon } from '@cio/ui/custom/moving-icons';
  import ImagePlaceholder from './image-placeholder.svelte';
  import CtaButton from './ui/cta-button.svelte';

  /**
   * @typedef {Object} Props
   * @property {string} [accent]          Small gradient line above the heading (e.g. "Academy", "Compliance AI")
   * @property {string} [title]           Main heading
   * @property {string} description       Subhead paragraph (1-3 sentences)
   * @property {string} [ctaLabel]        CTA button label (optional). Omit to hide the button.
   * @property {string} [ctaHref]         CTA destination
   * @property {string} [imagePath]       Suggested static file path for the image placeholder
   * @property {string} [imageCaption]    Caption shown inside the placeholder
   * @property {boolean} [showImage]      Show the image placeholder (default true)
   * @property {string} [imageSrc]        Real image path. When set, renders a real <img> (takes priority over vimeoVideoId).
   * @property {string} [imageAlt]        Alt text for the real image
   * @property {string} [vimeoVideoId]    Vimeo video id. When provided (and no imageSrc), replaces the image placeholder.
   * @property {string} [videoAspect]     CSS padding-top percentage controlling the video aspect ratio (default "54.68%")
   * @property {string} [videoTitle]      Accessible title for the iframe
   * @property {string} [bgClass]         Section background (default bg-white)
   */

  /** @type {Props} */
  let {
    accent = 'Academy',
    title = 'AI-powered Teaching Assistant',
    description,
    ctaLabel,
    ctaHref = '/customer-education',
    imagePath = '/static/ai-tutor-stack.png',
    imageCaption = 'AI tutor in a lesson with chat, follow-ups, translation, and summarisation',
    showImage = true,
    imageSrc,
    imageAlt = '',
    vimeoVideoId,
    videoAspect = '54.68%',
    videoTitle = 'AI Teaching Assistant on ClassroomIO.',
    bgClass = 'bg-white'
  } = $props();

  /** @type {HTMLElement | null} */
  let sectionEl = $state(null);
  let inZone = $state(true);

  const inZoneBorder = 'border-blue-500';
  const outZoneBorder = 'border-yellow-500';
  const inZoneBot = '#2563eb';
  const outZoneBot = '#eab308';
</script>

<section
  bind:this={sectionEl}
  role="region"
  aria-label={title}
  onmouseenter={() => (inZone = true)}
  onmouseleave={() => (inZone = false)}
  class="{bgClass} {inZone
    ? inZoneBorder
    : outZoneBorder} xl:py-section border-t-2 border-dashed px-6 py-20 transition-colors duration-200 md:px-10 md:py-28"
>
  <div class="max-w-content mx-auto w-full text-center">
    <BlurFade once>
      <div class="relative mx-auto mb-2 h-12 w-12">
        <div
          class="absolute inset-0 flex items-center justify-center transition-opacity duration-300 ease-in-out"
          style="opacity: {inZone ? 1 : 0}; pointer-events: {inZone ? 'auto' : 'none'};"
          aria-hidden={!inZone}
        >
          <BotIcon
            size={48}
            strokeWidth={1.6}
            color={inZoneBot}
            trackElement={sectionEl}
            trackRadius={420}
            maxEyeOffset={2.2}
          />
        </div>
        <div
          class="absolute inset-0 flex items-center justify-center transition-opacity duration-300 ease-in-out"
          style="opacity: {inZone ? 0 : 1}; pointer-events: {inZone ? 'none' : 'auto'};"
          aria-hidden={inZone}
        >
          <BotOffIcon size={48} strokeWidth={1.6} color={outZoneBot} />
        </div>
      </div>
      <p class="mb-6 text-[11px] text-gray-400">(you have full control over what i say and do)</p>
    </BlurFade>

    {#if accent}
      <BlurFade delay={0.05} once>
        <p
          class="bg-gradient-to-r from-blue-600 via-fuchsia-500 to-orange-400 bg-clip-text text-[clamp(1.4rem,2.2vw,2rem)] leading-[1.1] font-medium tracking-tight text-transparent"
        >
          {accent}
        </p>
      </BlurFade>
    {/if}

    <BlurFade delay={0.1} once>
      <h2 class="text-h2 mx-auto max-w-[900px] text-balance text-gray-950">
        {title}
      </h2>
    </BlurFade>

    <BlurFade delay={0.2} once>
      <p class="text-lead max-w-lede mx-auto mt-[18px] text-pretty text-gray-500">
        {description}
      </p>
    </BlurFade>

    {#if ctaLabel}
      <BlurFade delay={0.3} once>
        <div class="mt-9 flex justify-center">
          <CtaButton href={ctaHref} arrow class="bg-gray-950 hover:bg-blue-700 hover:brightness-100">
            {ctaLabel}
          </CtaButton>
        </div>
      </BlurFade>
    {/if}

    {#if !imageSrc && !vimeoVideoId && showImage}
      <BlurFade delay={0.35} once>
        <div class="mx-auto mt-12 w-full max-w-[820px]">
          <ImagePlaceholder suggestedFile={imagePath} caption={imageCaption} aspect="aspect-[16/9]" />
        </div>
      </BlurFade>
    {/if}
  </div>

  {#if imageSrc}
    <BlurFade delay={0.35} once>
      <div class="max-w-content mx-auto mt-12 w-full">
        <div class="overflow-hidden rounded-xl bg-white ring-1 ring-gray-200">
          <img src={imageSrc} alt={imageAlt} class="block h-auto w-full" loading="lazy" decoding="async" />
        </div>
      </div>
    </BlurFade>
  {:else if vimeoVideoId}
    <BlurFade delay={0.35} once>
      <div class="mx-auto mt-12 w-full max-w-[960px] overflow-hidden rounded-xl ring-1 ring-gray-200">
        <div style="padding:{videoAspect} 0 0 0;position:relative;">
          <iframe
            src="https://player.vimeo.com/video/{vimeoVideoId}?badge=0&autopause=0&player_id=0&app_id=58479&loop=1"
            frameborder="0"
            allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
            referrerpolicy="strict-origin-when-cross-origin"
            style="position:absolute;top:0;left:0;width:100%;height:100%;"
            title={videoTitle}
          ></iframe>
        </div>
      </div>
    </BlurFade>
  {/if}
</section>
