<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import {
    MinimalLearningPathLanding,
    BoldLearningPathLanding,
    ClassicLearningPathLanding,
    SaasLearningPathLanding,
    TechLearningPathLanding,
    StudioLearningPathLanding,
    CorporateLearningPathLanding,
    TerminalLearningPathLanding,
    EditorialLearningPathLanding,
    VibrantLearningPathLanding,
    QuartzLearningPathLanding,
    mockLearningPathLandingPageProps as mockProps
  } from '@cio/ui/custom/org-landing-page';

  const { Story } = defineMeta({
    title: 'Templates/Learning Path Detail Page',
    parameters: {
      layout: 'fullscreen'
    },
    tags: ['autodocs']
  });
</script>

<Story name="Minimal">
  <MinimalLearningPathLanding {...mockProps} />
</Story>

<Story name="Bold">
  <BoldLearningPathLanding {...mockProps} />
</Story>

<Story name="Classic">
  <ClassicLearningPathLanding {...mockProps} />
</Story>

<Story name="SaaS">
  <SaasLearningPathLanding {...mockProps} />
</Story>

<Story name="Tech">
  <TechLearningPathLanding {...mockProps} />
</Story>

<Story name="Studio">
  <StudioLearningPathLanding {...mockProps} />
</Story>

<Story name="Corporate">
  <CorporateLearningPathLanding {...mockProps} />
</Story>

<Story name="Terminal">
  <TerminalLearningPathLanding {...mockProps} />
</Story>

<Story name="Editorial">
  <EditorialLearningPathLanding {...mockProps} />
</Story>

<Story name="Vibrant">
  <VibrantLearningPathLanding {...mockProps} />
</Story>

<Story name="Quartz">
  <QuartzLearningPathLanding {...mockProps} />
</Story>

<Story name="Gallery · all themes">
  <div class="flex flex-col">
    <div class="sticky top-0 z-50 bg-black/85 px-4 py-2 text-xs text-white">Minimal</div>
    <MinimalLearningPathLanding {...mockProps} />
    <div class="sticky top-0 z-50 bg-black/85 px-4 py-2 text-xs text-white">Bold</div>
    <BoldLearningPathLanding {...mockProps} />
    <div class="sticky top-0 z-50 bg-black/85 px-4 py-2 text-xs text-white">Classic</div>
    <ClassicLearningPathLanding {...mockProps} />
    <div class="sticky top-0 z-50 bg-black/85 px-4 py-2 text-xs text-white">SaaS</div>
    <SaasLearningPathLanding {...mockProps} />
    <div class="sticky top-0 z-50 bg-black/85 px-4 py-2 text-xs text-white">Tech</div>
    <TechLearningPathLanding {...mockProps} />
    <div class="sticky top-0 z-50 bg-black/85 px-4 py-2 text-xs text-white">Studio</div>
    <StudioLearningPathLanding {...mockProps} />
    <div class="sticky top-0 z-50 bg-black/85 px-4 py-2 text-xs text-white">Corporate</div>
    <CorporateLearningPathLanding {...mockProps} />
    <div class="sticky top-0 z-50 bg-black/85 px-4 py-2 text-xs text-white">Terminal</div>
    <TerminalLearningPathLanding {...mockProps} />
    <div class="sticky top-0 z-50 bg-black/85 px-4 py-2 text-xs text-white">Editorial</div>
    <EditorialLearningPathLanding {...mockProps} />
    <div class="sticky top-0 z-50 bg-black/85 px-4 py-2 text-xs text-white">Vibrant</div>
    <VibrantLearningPathLanding {...mockProps} />
    <div class="sticky top-0 z-50 bg-black/85 px-4 py-2 text-xs text-white">Quartz</div>
    <QuartzLearningPathLanding {...mockProps} />
  </div>
</Story>
