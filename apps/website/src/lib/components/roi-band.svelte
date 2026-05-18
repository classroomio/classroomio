<script>
  import BoxedGrid from './boxed-grid.svelte';

  /**
   * @typedef {Object} Props
   * @property {string} [bgClass]
   * @property {string} [eyebrow]
   * @property {string} [heading]
   * @property {string} [subhead]
   */

  /** @type {Props} */
  let {
    bgClass = 'bg-white',
    eyebrow = 'The case for an academy',
    heading = 'Customers who learn the product, stay.',
    subhead = 'Numbers from teams who built one:'
  } = $props();

  const stats = [
    { value: '+22%', label: 'Higher retention', source: 'Forrester · customer-education TEI' },
    { value: '+38%', label: 'Product adoption', source: 'Intellum / Forrester benchmarks' },
    { value: '−6.1%', label: 'Support costs', source: 'TSIA · education services impact' }
  ];
</script>

<section class="{bgClass} px-6 py-12 lg:px-12 lg:py-16">
  <div class="mx-auto max-w-[1100px]">
    <div class="mb-8 max-w-[640px]">
      <div class="mb-2 text-xs font-medium tracking-widest text-blue-700 uppercase">{eyebrow}</div>
      <h2 class="text-[clamp(1.75rem,2.6vw,2.2rem)] leading-[1.15] font-medium tracking-tight">{heading}</h2>
      <p class="mt-3 text-sm leading-relaxed text-gray-500">{subhead}</p>
    </div>

    <BoxedGrid items={stats} cols={3} padding="px-5 py-10 lg:py-12">
      {#snippet cell(stat)}
        <div class="flex h-full flex-col items-center justify-center text-center">
          <p class="text-[clamp(2rem,3.4vw,2.8rem)] font-medium tracking-tight text-gray-950">{stat.value}</p>
          <p class="mt-1.5 text-sm text-gray-600">{stat.label}</p>
          <p class="mt-3 text-[11px] text-gray-400">{stat.source}</p>
        </div>
      {/snippet}
    </BoxedGrid>

    <p class="mt-4 text-xs text-gray-400">Industry benchmarks. Your mileage will vary.</p>
  </div>
</section>
