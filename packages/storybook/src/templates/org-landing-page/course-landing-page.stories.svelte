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
  <div class="ui:flex ui:flex-col">
    <div class="ui:sticky ui:top-0 ui:z-50 ui:bg-black/85 ui:text-white ui:text-xs ui:px-4 ui:py-2">Minimal</div>
    <MinimalCourseLanding {...mockProps} />
    <div class="ui:sticky ui:top-0 ui:z-50 ui:bg-black/85 ui:text-white ui:text-xs ui:px-4 ui:py-2">Bold</div>
    <BoldCourseLanding {...mockProps} />
    <div class="ui:sticky ui:top-0 ui:z-50 ui:bg-black/85 ui:text-white ui:text-xs ui:px-4 ui:py-2">Classic</div>
    <ClassicCourseLanding {...mockProps} />
    <div class="ui:sticky ui:top-0 ui:z-50 ui:bg-black/85 ui:text-white ui:text-xs ui:px-4 ui:py-2">SaaS</div>
    <SaasCourseLanding {...mockProps} />
    <div class="ui:sticky ui:top-0 ui:z-50 ui:bg-black/85 ui:text-white ui:text-xs ui:px-4 ui:py-2">Tech</div>
    <TechCourseLanding {...mockProps} />
    <div class="ui:sticky ui:top-0 ui:z-50 ui:bg-black/85 ui:text-white ui:text-xs ui:px-4 ui:py-2">Studio</div>
    <StudioCourseLanding {...mockProps} />
    <div class="ui:sticky ui:top-0 ui:z-50 ui:bg-black/85 ui:text-white ui:text-xs ui:px-4 ui:py-2">Corporate</div>
    <CorporateCourseLanding {...mockProps} />
    <div class="ui:sticky ui:top-0 ui:z-50 ui:bg-black/85 ui:text-white ui:text-xs ui:px-4 ui:py-2">Terminal</div>
    <TerminalCourseLanding {...mockProps} />
    <div class="ui:sticky ui:top-0 ui:z-50 ui:bg-black/85 ui:text-white ui:text-xs ui:px-4 ui:py-2">Editorial</div>
    <EditorialCourseLanding {...mockProps} />
    <div class="ui:sticky ui:top-0 ui:z-50 ui:bg-black/85 ui:text-white ui:text-xs ui:px-4 ui:py-2">Vibrant</div>
    <VibrantCourseLanding {...mockProps} />
  </div>
</Story>
