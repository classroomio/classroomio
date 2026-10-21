<script>
  import { BlurFade } from '@cio/ui/custom/animation/blurfade';
  import Code2 from '@lucide/svelte/icons/code-2';
  import CodeBlock from './code-block.svelte';
  import Eyebrow from './ui/eyebrow.svelte';
  import Section from './ui/section.svelte';

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

<Section class={bgClass}>
  <div class="mb-14 grid grid-cols-1 gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-end lg:gap-20">
    <BlurFade delay={0} once>
      <div>
        <Eyebrow class="inline-flex items-center gap-2 text-blue-700">
          <Code2 size={16} strokeWidth={1.8} />
          {eyebrow}
        </Eyebrow>
        <h2 class="text-h3 mt-4 text-balance">{title}</h2>
      </div>
    </BlurFade>
    <BlurFade delay={0.1} once>
      <p class="text-lead text-pretty text-gray-500">{description}</p>
    </BlurFade>
  </div>

  <div class="grid grid-cols-1 items-center gap-6 lg:grid-cols-[0.95fr_1.05fr]">
    <BlurFade delay={0.05} once class="min-w-0">
      <CodeBlock {fileName} {codeLines} lang="HTML" {statusBar} />
    </BlurFade>

    <BlurFade delay={0.15} once class="min-w-0">
      <div class="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div class="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
          <div class="h-2 w-2 rounded-full bg-red-400"></div>
          <div class="h-2 w-2 rounded-full bg-yellow-400"></div>
          <div class="h-2 w-2 rounded-full bg-green-500"></div>
          <div
            class="ml-3 flex min-w-0 flex-1 items-center gap-2 truncate rounded-sm bg-gray-50 px-3 py-1.5 font-mono text-xs text-gray-500"
          >
            <span class="text-green-600">●</span>
            {previewUrl}
          </div>
          <span class="text-tag shrink-0 rounded-full bg-blue-50 px-2 py-0.5 font-mono text-blue-700 uppercase"
            >Renders as →</span
          >
        </div>

        <img src={previewImageSrc} alt={previewAlt} class="block h-auto w-full" loading="lazy" decoding="async" />
      </div>
    </BlurFade>
  </div>

  {#if capabilities.length}
    <div class="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each capabilities as item, i}
        <BlurFade delay={0.05 * i} once class="h-full">
          <div class="h-full rounded-xl border border-gray-200 bg-white px-5 py-4">
            <p class="text-[15px] font-semibold text-gray-950">{item.label}</p>
            <p class="mt-0.5 text-sm text-gray-500">{item.sub}</p>
          </div>
        </BlurFade>
      {/each}
    </div>
  {/if}
</Section>
