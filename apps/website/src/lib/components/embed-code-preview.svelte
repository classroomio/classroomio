<script>
  import { BlurFade } from '@cio/ui/custom/animation/blurfade';
  import Code2 from '@lucide/svelte/icons/code-2';
  import CodeBlock from './code-block.svelte';

  /**
   * @typedef {Object} Capability
   * @property {string} label
   * @property {string} sub
   */

  /**
   * @typedef {Object} Props
   * @property {string} eyebrow                       Eyebrow label (e.g. "Embed anywhere")
   * @property {string} title                         Section heading
   * @property {string} description                   Body paragraph
   * @property {string} fileName                      Filename shown in code-editor chrome (e.g. "partner-portal.html")
   * @property {string[]} codeLines                   HTML-formatted lines for the code body (each may contain tag spans)
   * @property {string} statusBar                     Bottom status line text
   * @property {string} previewUrl                    URL shown in the preview browser bar
   * @property {string} previewImageSrc               Static path for the preview image
   * @property {string} [previewAlt]                  Alt text for the preview image
   * @property {Capability[]} [capabilities]          Optional 3 capability bullets shown below the pair
   * @property {string} [bgClass]                     Section background (default bg-white)
   */

  /** @type {Props} */
  let {
    eyebrow,
    title,
    description,
    fileName,
    codeLines,
    statusBar,
    previewUrl,
    previewImageSrc,
    previewAlt = '',
    capabilities = [],
    bgClass = 'bg-white'
  } = $props();
</script>

<section class="px-6 py-16 lg:px-12 lg:py-24 {bgClass}">
  <div class="mx-auto max-w-[1100px]">
    <!-- Intro -->
    <div class="mb-12 grid grid-cols-1 gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
      <BlurFade delay={0} once>
        <div>
          <div class="mb-3 inline-flex items-center gap-2 text-xs font-medium tracking-widest text-blue-700 uppercase">
            <Code2 size={14} />
            {eyebrow}
          </div>
          <h2 class="text-[clamp(2rem,3vw,2.6rem)] leading-[1.15] font-medium tracking-tight">{title}</h2>
        </div>
      </BlurFade>
      <BlurFade delay={0.1} once>
        <p class="text-base leading-relaxed text-gray-500">{description}</p>
      </BlurFade>
    </div>

    <!-- Code → Preview pair -->
    <div class="grid grid-cols-1 items-center gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <!-- LEFT: Code editor -->
      <BlurFade delay={0.05} once>
        <CodeBlock {fileName} {codeLines} lang="HTML" {statusBar} />
      </BlurFade>

      <!-- RIGHT: Preview -->
      <BlurFade delay={0.15} once>
        <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl/5">
          <!-- Browser chrome -->
          <div class="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
            <div class="h-2 w-2 rounded-full bg-red-400"></div>
            <div class="h-2 w-2 rounded-full bg-yellow-400"></div>
            <div class="h-2 w-2 rounded-full bg-green-500"></div>
            <div class="ml-3 flex flex-1 items-center gap-2 rounded-md bg-gray-50 px-3 py-1.5 text-xs text-gray-500">
              <span class="text-green-600">●</span>
              {previewUrl}
            </div>
            <span class="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">Renders as →</span>
          </div>

          <img src={previewImageSrc} alt={previewAlt} class="block h-auto w-full" loading="lazy" decoding="async" />
        </div>
      </BlurFade>
    </div>

    <!-- Capabilities -->
    {#if capabilities.length}
      <div class="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {#each capabilities as item, i}
          <BlurFade delay={0.05 * i} once>
            <div class="rounded-xl border border-gray-200 bg-white px-4 py-3">
              <p class="text-sm font-medium text-gray-950">{item.label}</p>
              <p class="text-xs text-gray-500">{item.sub}</p>
            </div>
          </BlurFade>
        {/each}
      </div>
    {/if}
  </div>
</section>
