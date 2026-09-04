<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import {
    MinimalCourseLanding,
    BoldCourseLanding,
    ClassicCourseLanding,
    SaasCourseLanding,
    TechCourseLanding,
    StudioCourseLanding,
    CorporateCourseLanding,
    TerminalCourseLanding,
    EditorialCourseLanding,
    VibrantCourseLanding,
    mockCourseLandingPageProps as mockProps
  } from '@cio/ui/custom/org-landing-page';

  const { Story } = defineMeta({
    title: 'Templates/Course Landing Page',
    parameters: {
      layout: 'fullscreen'
    },
    tags: ['autodocs']
  });
</script>

<Story name="Minimal">
  <MinimalCourseLanding {...mockProps} />
</Story>

<Story name="Bold">
  <BoldCourseLanding {...mockProps} />
</Story>

<Story name="Classic">
  <ClassicCourseLanding {...mockProps} />
</Story>

<Story name="SaaS">
  <SaasCourseLanding {...mockProps} />
</Story>

<Story name="Tech">
  <TechCourseLanding {...mockProps} />
</Story>

<Story name="Studio">
  <StudioCourseLanding {...mockProps} />
</Story>

<Story name="Corporate">
  <CorporateCourseLanding {...mockProps} />
</Story>

<Story name="Terminal">
  <TerminalCourseLanding {...mockProps} />
</Story>

<Story name="Editorial">
  <EditorialCourseLanding {...mockProps} />
</Story>

<Story name="Vibrant">
  <VibrantCourseLanding {...mockProps} />
</Story>

<Story name="Gallery · all themes">
  <div class="flex flex-col">
    <div class="sticky top-0 z-50 bg-black/85 px-4 py-2 text-xs text-white">Minimal</div>
    <MinimalCourseLanding {...mockProps} />
    <div class="sticky top-0 z-50 bg-black/85 px-4 py-2 text-xs text-white">Bold</div>
    <BoldCourseLanding {...mockProps} />
    <div class="sticky top-0 z-50 bg-black/85 px-4 py-2 text-xs text-white">Classic</div>
    <ClassicCourseLanding {...mockProps} />
    <div class="sticky top-0 z-50 bg-black/85 px-4 py-2 text-xs text-white">SaaS</div>
    <SaasCourseLanding {...mockProps} />
    <div class="sticky top-0 z-50 bg-black/85 px-4 py-2 text-xs text-white">Tech</div>
    <TechCourseLanding {...mockProps} />
    <div class="sticky top-0 z-50 bg-black/85 px-4 py-2 text-xs text-white">Studio</div>
    <StudioCourseLanding {...mockProps} />
    <div class="sticky top-0 z-50 bg-black/85 px-4 py-2 text-xs text-white">Corporate</div>
    <CorporateCourseLanding {...mockProps} />
    <div class="sticky top-0 z-50 bg-black/85 px-4 py-2 text-xs text-white">Terminal</div>
    <TerminalCourseLanding {...mockProps} />
    <div class="sticky top-0 z-50 bg-black/85 px-4 py-2 text-xs text-white">Editorial</div>
    <EditorialCourseLanding {...mockProps} />
    <div class="sticky top-0 z-50 bg-black/85 px-4 py-2 text-xs text-white">Vibrant</div>
    <VibrantCourseLanding {...mockProps} />
  </div>
</Story>
