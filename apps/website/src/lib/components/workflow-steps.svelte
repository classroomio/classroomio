<script>
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
  let { eyebrow, title, description, steps, bgClass = 'bg-white' } = $props();

  let hoveredIndex = $state(-1);

  function isActive(index) {
    if (hoveredIndex === -1) return index === 0;
    return index <= hoveredIndex;
  }
</script>

<section class="px-6 py-12 lg:px-12 lg:py-16 {bgClass}">
  <div class="mx-auto max-w-[1100px]">
    <div class="max-w-[680px]">
      <div class="mb-2 text-xs font-medium tracking-widest text-blue-700 uppercase">{eyebrow}</div>
      <h2 class="text-[clamp(1.75rem,2.6vw,2.2rem)] leading-[1.15] font-medium tracking-tight">{title}</h2>
      {#if description}
        <p class="mt-5 text-base leading-relaxed text-gray-500">{description}</p>
      {/if}
    </div>

    <!-- Desktop: horizontal timeline -->
    <div class="mt-12 hidden! md:block!">
      <div class="relative">
        <!-- connecting line -->
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
                  <span class="absolute inline-flex h-3.5 w-3.5 animate-ping rounded-full bg-blue-500 opacity-60"
                  ></span>
                {/if}
              </span>

              <div class="mt-6">
                <h3 class="text-sm font-medium text-gray-950">{step.title}</h3>
                <p class="mt-2 text-sm leading-relaxed text-gray-500">{step.description}</p>
                <p
                  class="mt-4 font-mono text-[10px] tracking-[0.15em] uppercase transition-colors duration-200 {isActive(
                    i
                  )
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

    <!-- Mobile: vertical timeline -->
    <div class="mt-10 md:hidden!">
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
            <h3 class="text-sm font-medium text-gray-950">{step.title}</h3>
            <p class="mt-2 text-sm leading-relaxed text-gray-500">{step.description}</p>
            <p
              class="mt-3 font-mono text-[10px] tracking-[0.15em] uppercase transition-colors duration-200 {isActive(i)
                ? 'text-blue-700'
                : 'text-gray-400'}"
            >
              {step.label ?? `Step ${String(i + 1).padStart(2, '0')}`}
            </p>
          </div>
        {/each}
      </div>
    </div>
  </div>
</section>
