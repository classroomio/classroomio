<script>
  import BoxedGrid from './boxed-grid.svelte';
  import Section from './ui/section.svelte';
  import SectionHeader from './ui/section-header.svelte';

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

<Section class={bgClass}>
  <SectionHeader {eyebrow} eyebrowClass="text-blue-700" lede={subhead} ledeClass="text-gray-500" titleClass="">
    {#snippet title()}{heading}{/snippet}
  </SectionHeader>

  <div class="mt-12">
    <BoxedGrid items={stats} cols={3} padding="px-6 py-10 lg:py-12">
      {#snippet cell(stat)}
        <div class="flex h-full flex-col items-center justify-center text-center">
          <p class="text-h3 text-gray-950">{stat.value}</p>
          <p class="mt-2 text-[15px] text-gray-600">{stat.label}</p>
          <p class="mt-3 text-xs text-gray-400">{stat.source}</p>
        </div>
      {/snippet}
    </BoxedGrid>

    <p class="mt-4 text-center text-xs text-gray-400">Industry benchmarks. Your mileage will vary.</p>
  </div>
</Section>
