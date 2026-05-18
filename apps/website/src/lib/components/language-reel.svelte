<script>
  import { BlurFade } from '@cio/ui/custom/animation/blurfade';
  import Check from '@lucide/svelte/icons/check';
  import Languages from '@lucide/svelte/icons/languages';

  /**
   * @typedef {Object} Lang
   * @property {string} code      Two-letter language code (e.g. "en", "es")
   * @property {string} native    Native script name (e.g. "Español", "हिन्दी")
   * @property {string} en        English name (e.g. "Spanish", "Hindi")
   * @property {string} sample    Translated sample lesson title in this language
   * @property {string} tone      Tailwind gradient classes (e.g. "from-blue-100 to-blue-200")
   * @property {string} ring      Tailwind ring color class (e.g. "ring-blue-200")
   */

  /**
   * @typedef {Object} Props
   * @property {Lang[]} langs
   * @property {string} eyebrow            Eyebrow label (e.g. "Global partners")
   * @property {string} headlineLead       Headline lead text (e.g. "Train your network")
   * @property {string} headlineAccent     Headline accent text shown in blue with a sweep (e.g. "in their language.")
   * @property {string} description        Body paragraph
   * @property {string} moduleLabel        Top of preview card (e.g. "Module 2 · Implementation")
   * @property {string} footerLabel        Bottom badge in preview card (e.g. "8 lessons" or "6 lessons · 18 min")
   * @property {string} [bgClass]          Optional section background (defaults to bg-gray-50)
   */

  /** @type {Props} */
  let {
    langs,
    eyebrow,
    headlineLead,
    headlineAccent,
    description,
    moduleLabel,
    footerLabel,
    bgClass = 'bg-gray-50'
  } = $props();
</script>

<section class="relative overflow-hidden px-6 py-16 lg:px-12 lg:py-24 {bgClass}">
  <div
    class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_40%,rgba(2,51,189,0.06),transparent_55%)]"
  ></div>

  <div class="relative mx-auto max-w-[1100px]">
    <div class="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
      <BlurFade delay={0} once>
        <div>
          <div class="mb-3 inline-flex items-center gap-2 text-xs font-medium tracking-widest text-blue-700 uppercase">
            <Languages size={14} />
            {eyebrow}
          </div>
          <h2 class="text-[clamp(2rem,3vw,2.6rem)] leading-[1.15] font-medium tracking-tight">
            {headlineLead}
            <span class="cio-lang-headline relative inline-block">
              <span class="text-blue-700">{headlineAccent}</span>
            </span>
          </h2>
          <p class="mt-5 text-base leading-relaxed text-gray-500">{description}</p>

          <!-- Inline language switcher mock -->
          <div
            class="mt-7 inline-flex w-full max-w-[320px] flex-col rounded-2xl border border-gray-200 bg-white p-1.5 shadow-sm"
          >
            <div class="px-3 py-1.5 text-[10px] font-medium tracking-widest text-gray-500 uppercase">
              Lesson language
            </div>
            <div class="space-y-1">
              {#each langs.slice(0, 4) as lang, i}
                <div
                  class="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-gray-50 {i ===
                  1
                    ? 'bg-blue-50'
                    : ''}"
                >
                  <div class="flex items-center gap-3">
                    <span
                      class="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br {lang.tone} text-[10px] font-bold text-gray-800 ring-1 {lang.ring}"
                    >
                      {lang.code.toUpperCase()}
                    </span>
                    <span class="text-sm text-gray-800">{lang.native}</span>
                    <span class="text-xs text-gray-400">{lang.en}</span>
                  </div>
                  {#if i === 1}
                    <Check size={14} class="text-blue-700" />
                  {/if}
                </div>
              {/each}
              <div class="rounded-lg px-3 py-2 text-xs text-gray-400">
                + {Math.max(0, langs.length - 4)} more languages
              </div>
            </div>
          </div>
        </div>
      </BlurFade>

      <!-- Animated polyglot lesson reel -->
      <BlurFade delay={0.15} once>
        <div class="relative">
          <div
            class="pointer-events-none absolute -inset-4 z-0 rounded-3xl bg-[conic-gradient(from_30deg,rgba(2,51,189,0.08),rgba(2,51,189,0.18),rgba(2,51,189,0.08))] blur-2xl"
          ></div>

          <div class="relative rounded-2xl border border-gray-200 bg-white shadow-2xl/5">
            <div class="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
              <div class="flex items-center gap-2 text-xs text-gray-500">
                <span class="relative flex h-2 w-2">
                  <span class="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-blue-500 opacity-60"></span>
                  <span class="relative inline-flex h-2 w-2 rounded-full bg-blue-600"></span>
                </span>
                {moduleLabel}
              </div>
              <div class="text-[10px] font-medium tracking-widest text-blue-700 uppercase">Live preview</div>
            </div>

            <!-- Cycling lesson card -->
            <div class="relative h-[260px] overflow-hidden">
              {#each langs as lang, i}
                <div
                  class="cio-lang-cycle absolute inset-0 flex flex-col px-6 py-6"
                  style:--delay="{i * 2}s"
                  style:--total="{langs.length * 2}s"
                >
                  <div class="mb-4 flex items-center gap-3">
                    <span
                      class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br {lang.tone} text-sm font-bold text-gray-800 ring-1 {lang.ring}"
                    >
                      {lang.code.toUpperCase()}
                    </span>
                    <div>
                      <p class="text-[11px] tracking-wide text-gray-400 uppercase">Now rendering · {lang.en}</p>
                      <p class="text-xs text-gray-600">{lang.native}</p>
                    </div>
                  </div>
                  <p class="text-xl leading-snug font-medium text-gray-950" dir="auto">{lang.sample}</p>
                  <div class="mt-5 space-y-2">
                    <div class="h-1.5 w-[88%] rounded-full bg-gray-100"></div>
                    <div class="h-1.5 w-[72%] rounded-full bg-gray-100"></div>
                    <div class="h-1.5 w-[60%] rounded-full bg-gray-100"></div>
                  </div>
                  <div class="mt-auto flex items-center justify-between pt-4">
                    <span class="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-medium text-blue-700"
                      >{footerLabel}</span
                    >
                    <span class="text-[10px] text-gray-400">auto · per-learner language</span>
                  </div>
                </div>
              {/each}
            </div>

            <!-- Progress dots -->
            <div class="border-t border-gray-100 px-5 py-3">
              <div class="flex items-center justify-center gap-1.5">
                {#each langs as _, i}
                  <span
                    class="cio-lang-dot h-1.5 rounded-full bg-gray-200"
                    style:--delay="{i * 2}s"
                    style:--total="{langs.length * 2}s"
                  ></span>
                {/each}
              </div>
            </div>
          </div>
        </div>
      </BlurFade>
    </div>
  </div>
</section>

<style>
  /* Each language gets a 2s window; total = langs.length × 2s, supplied via --total */
  .cio-lang-cycle {
    opacity: 0;
    animation: cio-lang-fade var(--total, 20s) ease-in-out infinite;
    animation-delay: var(--delay, 0s);
  }
  @keyframes cio-lang-fade {
    0% {
      opacity: 0;
      transform: translateY(8px);
    }
    1% {
      opacity: 1;
      transform: translateY(0);
    }
    9% {
      opacity: 1;
      transform: translateY(0);
    }
    11% {
      opacity: 0;
      transform: translateY(-8px);
    }
    100% {
      opacity: 0;
      transform: translateY(-8px);
    }
  }
  .cio-lang-dot {
    width: 6px;
    animation: cio-lang-dot var(--total, 20s) ease-in-out infinite;
    animation-delay: var(--delay, 0s);
  }
  @keyframes cio-lang-dot {
    0%,
    11%,
    100% {
      background-color: rgb(229 231 235);
      width: 6px;
    }
    1%,
    9% {
      background-color: rgb(29 78 216);
      width: 22px;
    }
  }
  .cio-lang-headline::before {
    content: '';
    position: absolute;
    inset: auto 0 -2px 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(29, 78, 216, 0.35), transparent);
    animation: cio-lang-sweep 3.5s ease-in-out infinite;
  }
  @keyframes cio-lang-sweep {
    0%,
    100% {
      transform: translateX(-100%);
      opacity: 0;
    }
    50% {
      transform: translateX(100%);
      opacity: 1;
    }
  }
</style>
