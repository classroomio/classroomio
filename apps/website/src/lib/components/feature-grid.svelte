<script>
  import { BlurFade } from '@cio/ui/custom/animation/blurfade';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';

  /**
   * @typedef {Object} Feature
   * @property {any}    Icon
   * @property {string} title
   * @property {string} description
   */

  /**
   * @typedef {Object} Props
   * @property {string}    eyebrow
   * @property {string}    title
   * @property {string}    [description]
   * @property {string}    [ctaLabel]
   * @property {string}    [ctaHref]
   * @property {Feature[]} features
   * @property {2|3|4}     [columns]     Desktop columns (default 3)
   * @property {string}    [bgClass]
   */

  /** @type {Props & { headerAside?: import('svelte').Snippet }} */
  let {
    eyebrow,
    title,
    description,
    ctaLabel,
    ctaHref,
    features,
    columns = 3,
    bgClass = 'bg-white',
    headerAside
  } = $props();

  // Per-columns class string so Tailwind picks up the arbitrary nth-child variants statically.
  const gridClass = {
    2: 'sm:grid-cols-2 [&>*:nth-child(2n)]:sm:border-r-0 [&>*:nth-last-child(-n+2)]:sm:border-b-0',
    3: 'sm:grid-cols-2 lg:grid-cols-3 [&>*:nth-child(2n)]:sm:border-r-0 [&>*:nth-child(2n)]:lg:border-r [&>*:nth-child(3n)]:lg:border-r-0 [&>*:nth-last-child(-n+2)]:sm:border-b-0 [&>*:nth-last-child(-n+3)]:lg:border-b-0',
    4: 'sm:grid-cols-2 lg:grid-cols-4 [&>*:nth-child(2n)]:sm:border-r-0 [&>*:nth-child(2n)]:lg:border-r [&>*:nth-child(4n)]:lg:border-r-0 [&>*:nth-last-child(-n+2)]:sm:border-b-0 [&>*:nth-last-child(-n+4)]:lg:border-b-0'
  }[columns];
</script>

<section class="px-6 py-12 lg:px-12 lg:py-16 {bgClass}">
  <div class="mx-auto max-w-[1100px]">
    <div class="mb-10 grid grid-cols-1 gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-20">
      <div>
        <div class="mb-3 text-xs font-medium tracking-widest text-blue-700 uppercase">{eyebrow}</div>
        <h2 class="text-[clamp(2rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-tight text-gray-950">
          {title}
        </h2>
      </div>

      {#if headerAside}
        <div class="flex flex-col justify-start lg:pt-2">
          {@render headerAside()}
        </div>
      {:else if description || ctaLabel}
        <div class="flex flex-col justify-start lg:pt-2">
          {#if description}
            <p class="text-base leading-relaxed text-gray-600">{description}</p>
          {/if}
          {#if ctaLabel && ctaHref}
            <a
              href={ctaHref}
              class="mt-6 inline-flex w-fit items-center gap-2 text-sm font-medium text-blue-700 underline decoration-blue-300 underline-offset-4 transition-colors hover:text-blue-800 hover:decoration-blue-500"
            >
              {ctaLabel}
              <ArrowRight size={16} />
            </a>
          {/if}
        </div>
      {/if}
    </div>

    <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div class="grid grid-cols-1 {gridClass}">
        {#each features as feature, i}
          <div class="group relative border-b border-gray-200 transition-colors hover:bg-gray-50/60 sm:border-r">
            <BlurFade delay={0.04 * i} once>
              <div class="h-full p-6">
                <p class="font-mono text-[11px] tracking-[0.15em] text-gray-400">
                  {String(i + 1).padStart(2, '0')}
                </p>
                <div class="mt-4 flex items-center gap-2.5">
                  <span class="text-blue-700"><feature.Icon size={18} /></span>
                  <h3 class="text-sm font-semibold text-gray-950">{feature.title}</h3>
                </div>
                <p class="mt-3 text-sm leading-relaxed text-gray-500">{feature.description}</p>
              </div>
            </BlurFade>
          </div>
        {/each}
      </div>
    </div>
  </div>
</section>
