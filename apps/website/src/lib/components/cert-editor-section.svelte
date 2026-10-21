<script>
  import { BlurFade } from '@cio/ui/custom/animation/blurfade';
  import ImagePlaceholder from './image-placeholder.svelte';
  import Section from './ui/section.svelte';
  import SectionHeader from './ui/section-header.svelte';
</script>

<Section class="bg-white">
  <BlurFade delay={0} once>
    <SectionHeader
      eyebrow="Certificate templates"
      eyebrowClass="text-blue-700"
      ledeClass="text-gray-500"
      lede="A real design canvas. Drag elements, swap brand colours and fonts, configure the ID format. Issue PDFs and PNGs learners want to share."
    >
      {#snippet title()}
        Design certificates that
        <em class="text-blue-700 not-italic">look like yours.</em>
      {/snippet}
    </SectionHeader>
  </BlurFade>

  <BlurFade delay={0.1} once class="mt-14">
    <ImagePlaceholder
      suggestedFile="/static/certificate-editor.png"
      caption="Screenshot of the certificate template editor"
      aspect="aspect-[16/9]"
    />
  </BlurFade>
</Section>
