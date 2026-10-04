<script>
  import Section from './ui/section.svelte';
  import SectionHeader from './ui/section-header.svelte';

  /**
   * @typedef {Object} Step
   * @property {string} title
   * @property {string} description
   * @property {string} [label]   Optional small uppercase label shown below the description (e.g. "STEP 01")
   */

  /**
   * @typedef {Object} Props
   * @property {string} eyebrow              Eyebrow label (e.g. "How it works")
   * @property {string} title                Section heading
   * @property {string} [description]        Optional lead paragraph below the heading
   * @property {Step[]} steps                Workflow steps (typically 4)
   * @property {string} [bgClass]            Optional section background (default bg-white)
   */

  /** @type {Props} */
  let { eyebrow, title: heading, description, steps, bgClass = 'bg-white' } = $props();

  let hoveredIndex = $state(-1);

  function isActive(index) {
    if (hoveredIndex === -1) return index === 0;
    return index <= hoveredIndex;
  }
</script>

<Section class={bgClass}>
  <SectionHeader {eyebrow} eyebrowClass="text-blue-700" lede={description} ledeClass="text-gray-500" titleClass="">
    {#snippet title()}{heading}{/snippet}
  </SectionHeader>

  <div class="mt-16 hidden! md:block!">
    <div class="relative">
      <div class="absolute top-[7px] right-2 left-2 h-px bg-gray-200"></div>

      <div
        class="relative grid gap-8"
        style:grid-template-columns="repeat({steps.length}, minmax(0, 1fr))"
        onmouseleave={() => (hoveredIndex = -1)}
        role="presentation"
      >
        {#each steps as step, i}
          <div class="relative" onmouseenter={() => (hoveredIndex = i)} role="presentation">
            <span
              class="relative z-10 flex h-3.5 w-3.5 items-center justify-center rounded-full transition-all duration-200 {isActive(
                i
              )
                ? 'bg-blue-700 ring-4 ring-blue-100'
                : 'bg-gray-300'}"
            >
              {#if i === 0 && hoveredIndex === -1}
                <span class="absolute inline-flex h-3.5 w-3.5 animate-ping rounded-full bg-blue-500 opacity-60"></span>
              {/if}
            </span>

            <div class="mt-6">
              <h3 class="text-card-title font-medium text-gray-950">{step.title}</h3>
              <p class="mt-2 text-[15px] leading-relaxed text-gray-500">{step.description}</p>
              <p
                class="text-label mt-4 font-mono uppercase transition-colors duration-200 {isActive(i)
                  ? 'text-blue-700'
                  : 'text-gray-400'}"
              >
                {step.label ?? `Step ${String(i + 1).padStart(2, '0')}`}
              </p>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <div class="mt-12 md:hidden!">
    <div class="relative space-y-8 pl-6" onmouseleave={() => (hoveredIndex = -1)} role="presentation">
      <div class="absolute top-2 bottom-2 left-[6px] w-px bg-gray-200"></div>

      {#each steps as step, i}
        <div class="relative" onmouseenter={() => (hoveredIndex = i)} role="presentation">
          <span
            class="absolute top-1 -left-6 flex h-3 w-3 items-center justify-center rounded-full transition-all duration-200 {isActive(
              i
            )
              ? 'bg-blue-700 ring-4 ring-blue-100'
              : 'bg-gray-300'}"
          ></span>
          <h3 class="text-card-title font-medium text-gray-950">{step.title}</h3>
          <p class="mt-2 text-[15px] leading-relaxed text-gray-500">{step.description}</p>
          <p
            class="text-label mt-3 font-mono uppercase transition-colors duration-200 {isActive(i)
              ? 'text-blue-700'
              : 'text-gray-400'}"
          >
            {step.label ?? `Step ${String(i + 1).padStart(2, '0')}`}
          </p>
        </div>
      {/each}
    </div>
  </div>
</Section>
