<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import {
    MinimalLandingPage,
    BoldLandingPage,
    ClassicLandingPage,
    SaasLandingPage,
    TechLandingPage,
    StudioLandingPage,
    CorporateLandingPage,
    TerminalLandingPage,
    EditorialLandingPage,
    VibrantLandingPage,
    mockOrgLandingPageProps as mockProps
  } from '@cio/ui/custom/org-landing-page';

  const { Story } = defineMeta({
    title: 'Templates/Org Landing Page',
    parameters: {
      layout: 'fullscreen'
    },
    tags: ['autodocs']
  });

  /** Example of overriding UI chrome labels (e.g. via the dashboard's translations). */
  const localizedLabels = {
    catalogEyebrow: 'Catálogo',
    catalogHeading: 'Programas que empiezan esta temporada.',
    catalogDescription:
      'Cohortes y a tu propio ritmo — cada programa termina con un proyecto revisado y un certificado.',
    browseCoursesLabel: 'Ver todos →',
    enrollLabel: 'Inscribirme',
    freeLabel: 'Gratis',
    featuredLabel: 'Destacado',
    filterAllLabel: 'Todos',
    startCourseLabel: 'Empezar curso',
    resourcesEyebrow: 'Recursos',
    embedEyebrow: 'Integración',
    calloutEyebrow: 'Cuando quieras',
    learnMoreLabel: 'Visitar',
    lessonsLabel: (n) => (n === 1 ? '1 lección' : `${n} lecciones`),
    exercisesLabel: (n) => (n === 1 ? '1 ejercicio' : `${n} ejercicios`),
    enrolledLabel: (n) => `${n.toLocaleString()} inscritos`
  };
</script>

<Story name="Minimal">
  <MinimalLandingPage {...mockProps} />
</Story>

<Story name="Bold">
  <BoldLandingPage {...mockProps} />
</Story>

<Story name="Classic">
  <ClassicLandingPage {...mockProps} />
</Story>

<Story name="SaaS">
  <SaasLandingPage {...mockProps} />
</Story>

<Story name="Tech">
  <TechLandingPage {...mockProps} />
</Story>

<Story name="Studio">
  <StudioLandingPage {...mockProps} />
</Story>

<Story name="Corporate">
  <CorporateLandingPage {...mockProps} />
</Story>

<Story name="Terminal">
  <TerminalLandingPage {...mockProps} />
</Story>

<Story name="Editorial">
  <EditorialLandingPage {...mockProps} />
</Story>

<Story name="Vibrant">
  <VibrantLandingPage {...mockProps} />
</Story>

<!--
  Demonstrates the OrgLandingPageLabels override surface. Every UI-chrome
  string is replaced via the `labels` prop; per-template defaults disappear.
-->
<Story name="Editorial (localized labels)">
  <EditorialLandingPage {...mockProps} labels={localizedLabels} />
</Story>
