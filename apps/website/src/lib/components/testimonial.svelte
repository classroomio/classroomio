<script>
  import { SenjaEmbed } from '$lib/components';
  import Section from './ui/section.svelte';
  import SectionHeader from './ui/section-header.svelte';
</script>

<Section id="testimonial" class="bg-white">
  <SectionHeader
    eyebrow="Testimonials"
    eyebrowClass="text-blue-700"
    lede="Short notes from people running customer, partner, and internal training on ClassroomIO."
    ledeClass="text-gray-500"
    titleClass=""
  >
    {#snippet title()}What teams say after they ship an academy{/snippet}
  </SectionHeader>

  <div class="relative mx-auto mt-12 w-full">
    <SenjaEmbed id="3e847d7a-13d3-483e-8a71-5b35273dcc6c" />
  </div>
</Section>
