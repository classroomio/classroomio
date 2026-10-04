<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import {
    BlockSkyline,
    BlurFade,
    BlurIn,
    BorderBeam,
    BrandWash,
    CardBody,
    CardContainer,
    DotField,
    DotPattern,
    GradualSpacing,
    HeroVideoDialog,
    MachineBrandStand,
    MachineCertificatePress,
    MachineEventWire,
    MachineGlassBox,
    MachineRepeater,
    MachineSpectrum,
    MachineTrainingLine,
    MagicCard,
    Meteors,
    ShimmerButton,
    ShinnyText,
    Sparkle,
    SquareCardBody,
    SquareCardIcon,
    Waves
  } from '@cio/ui/custom/animation';

  const { Story } = defineMeta({
    title: 'Molecules/Animation',
    parameters: {
      layout: 'fullscreen'
    },
    tags: ['autodocs']
  });
</script>

<Story name="BorderBeam">
  {#snippet template()}
    <div class="ui:bg-muted relative mx-auto flex h-48 w-80 items-center justify-center rounded-xl border">
      <BorderBeam />
      <span class="relative z-10 text-sm font-medium">Border beam</span>
    </div>
  {/snippet}
</Story>

<Story name="DotPattern">
  {#snippet template()}
    <div class="ui:bg-background relative mx-auto h-48 w-80 overflow-hidden rounded-xl border">
      <DotPattern />
      <div class="relative z-10 flex h-full items-center justify-center text-sm">Dot pattern</div>
    </div>
  {/snippet}
</Story>

<Story name="DotField">
  {#snippet template()}
    <div class="ui:bg-background relative mx-auto h-[500px] w-full max-w-3xl overflow-hidden rounded-xl border">
      <DotField
        dotRadius={1.5}
        dotSpacing={14}
        cursorRadius={500}
        cursorForce={0.1}
        bulgeOnly={true}
        bulgeStrength={67}
        glowRadius={160}
        sparkle={false}
        waveAmplitude={0}
        class="absolute inset-0 h-full w-full"
      />
      <div class="relative z-10 flex h-full items-center justify-center text-sm">Move the cursor over this area</div>
    </div>
  {/snippet}
</Story>

<Story name="Waves">
  {#snippet template()}
    <div class="ui:bg-background relative mx-auto h-[500px] w-full max-w-3xl overflow-hidden rounded-xl border">
      <Waves class="absolute inset-0 h-full w-full" />
      <div class="relative z-10 flex h-full items-center justify-center text-sm">
        Move the cursor — animated waves use the theme primary stroke
      </div>
    </div>
  {/snippet}
</Story>

<Story name="CardContainer">
  {#snippet template()}
    <CardContainer className="max-w-lg">
      {#snippet children()}
        <CardBody>
          {#snippet children()}
            <p class="text-center text-sm">Card container with body</p>
          {/snippet}
        </CardBody>
      {/snippet}
    </CardContainer>
  {/snippet}
</Story>

<Story name="BlurFade">
  {#snippet template()}
    <div class="p-8">
      <BlurFade>
        {#snippet children()}
          <p class="text-lg">Scroll into view (blur fade)</p>
        {/snippet}
      </BlurFade>
    </div>
  {/snippet}
</Story>

<Story name="BlurIn">
  {#snippet template()}
    <div class="p-8 text-center">
      <BlurIn>
        {#snippet children()}
          Blur in heading
        {/snippet}
      </BlurIn>
    </div>
  {/snippet}
</Story>

<Story name="Meteors">
  {#snippet template()}
    <div class="relative mx-auto min-h-64 w-full max-w-xl overflow-visible rounded-xl border bg-slate-950 p-4">
      <Meteors number={12} />
      <p class="relative z-10 p-6 text-center text-sm text-slate-300">Meteors (absolute layer behind this copy)</p>
    </div>
  {/snippet}
</Story>

<Story name="ShimmerButton">
  {#snippet template()}
    <div class="flex justify-center bg-neutral-950 p-8">
      <ShimmerButton href="https://example.com" target="_blank" rel="noreferrer">
        {#snippet children()}
          Shimmer CTA
        {/snippet}
      </ShimmerButton>
    </div>
  {/snippet}
</Story>

<Story name="Sparkle">
  {#snippet template()}
    <div class="ui:bg-background flex justify-center p-12">
      <Sparkle text="Sparkle text" sparklesCount={6} />
    </div>
  {/snippet}
</Story>

<Story name="HeroVideoDialog">
  {#snippet template()}
    <div class="mx-auto max-w-2xl p-8">
      <HeroVideoDialog
        thumbnailSrc="https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1200&q=80"
        videoSrc="https://www.youtube.com/embed/dQw4w9WgXcQ"
        thumbnailAlt="Sample"
      />
    </div>
  {/snippet}
</Story>

<Story name="ShinnyText">
  {#snippet template()}
    <div class="ui:bg-background flex justify-center p-12">
      <ShinnyText shimmerWidth={120}>
        {#snippet children()}
          Shiny marketing copy
        {/snippet}
      </ShinnyText>
    </div>
  {/snippet}
</Story>

<Story name="MagicCard">
  {#snippet template()}
    <div class="mx-auto h-40 max-w-sm p-4">
      <MagicCard>
        {#snippet children()}
          <p class="text-center text-sm">Hover for gradient</p>
        {/snippet}
      </MagicCard>
    </div>
  {/snippet}
</Story>

<Story name="GradualSpacing">
  {#snippet template()}
    <div class="ui:bg-background p-12">
      <GradualSpacing words="Hello" />
    </div>
  {/snippet}
</Story>

<Story name="SquareCard">
  {#snippet template()}
    <div class="relative mx-auto w-64 rounded-lg border p-6">
      <SquareCardIcon class="top-2 right-2" />
      <SquareCardBody>
        {#snippet children()}
          <p class="text-sm">Square card body with icon</p>
        {/snippet}
      </SquareCardBody>
    </div>
  {/snippet}
</Story>

<Story name="BrandWash">
  {#snippet template()}
    <div class="ui:bg-background relative mx-auto h-80 w-full max-w-3xl overflow-hidden rounded-xl border">
      <BrandWash />
      <div class="relative flex h-full items-center justify-center text-sm">Brand wash with dots</div>
    </div>
  {/snippet}
</Story>

<Story name="BrandWash without dots">
  {#snippet template()}
    <div class="ui:bg-background relative mx-auto h-80 w-full max-w-3xl overflow-hidden rounded-xl border">
      <BrandWash dots={false} />
      <div class="relative flex h-full items-center justify-center text-sm">Brand wash only</div>
    </div>
  {/snippet}
</Story>

<Story name="BlockSkyline">
  {#snippet template()}
    <div class="ui:bg-background mx-auto flex w-full max-w-md items-end rounded-xl border p-8">
      <BlockSkyline class="w-full" />
    </div>
  {/snippet}
</Story>

<Story name="BlockSkyline once, full width">
  {#snippet template()}
    <div class="ui:bg-background relative mx-auto h-64 w-full overflow-hidden rounded-xl border">
      <BlockSkyline loop={false} repeat={3} class="absolute inset-x-0 bottom-0 px-4" />
    </div>
  {/snippet}
</Story>

<Story name="Notch cutout">
  {#snippet template()}
    <div class="ui:bg-background relative mx-auto h-80 w-full max-w-3xl overflow-hidden rounded-xl border">
      <BrandWash />
      <div class="relative flex h-full items-center justify-center">
        <div class="ui:bg-background ui:notch-cutout h-40 w-72 rounded-xl border p-6 text-sm">
          The notch is a mask, so the wash shows through it.
        </div>
      </div>
    </div>
  {/snippet}
</Story>

<Story name="MachineTrainingLine">
  {#snippet template()}
    <div class="ui:bg-muted mx-auto w-full max-w-3xl rounded-xl border p-6">
      <MachineTrainingLine label="Lessons move down a line and each one is stamped" class="h-96" />
    </div>
  {/snippet}
</Story>

<Story name="MachineRepeater">
  {#snippet template()}
    <div class="ui:bg-muted mx-auto w-full max-w-3xl rounded-xl border p-6">
      <MachineRepeater label="An expert repeats the same explanation to each new customer" class="h-80" />
    </div>
  {/snippet}
</Story>

<Story name="MachineSpectrum">
  {#snippet template()}
    <div class="ui:bg-muted mx-auto w-full max-w-3xl rounded-xl border p-6">
      <MachineSpectrum label="A learner rides up five levels to certified training" class="h-96" />
    </div>
  {/snippet}
</Story>

<Story name="MachineCertificatePress">
  {#snippet template()}
    <div class="ui:bg-muted mx-auto w-full max-w-3xl rounded-xl border p-6">
      <MachineCertificatePress label="Certificates are stamped, then checked against a public URL" class="h-80" />
    </div>
  {/snippet}
</Story>

<Story name="MachineBrandStand">
  {#snippet template()}
    <div class="ui:bg-muted mx-auto w-full max-w-3xl rounded-xl border p-6">
      <MachineBrandStand label="A shop front changes branding for each customer" class="h-80" />
    </div>
  {/snippet}
</Story>

<Story name="MachineEventWire">
  {#snippet template()}
    <div class="ui:bg-muted mx-auto w-full max-w-3xl rounded-xl border p-6">
      <MachineEventWire label="Events travel from ClassroomIO to a CRM and a help desk" class="h-80" />
    </div>
  {/snippet}
</Story>

<Story name="MachineGlassBox">
  {#snippet template()}
    <div class="ui:bg-muted mx-auto w-full max-w-3xl rounded-xl border p-6">
      <MachineGlassBox label="The same mechanism runs in plain sight inside a glass case" class="h-80" />
    </div>
  {/snippet}
</Story>

<Story name="MachineGlassBox with price">
  {#snippet template()}
    <div class="ui:bg-muted mx-auto w-full max-w-3xl rounded-xl border p-6">
      <MachineGlassBox label="The same mechanism runs in plain sight inside a glass case" price="35/mo" class="h-80" />
    </div>
  {/snippet}
</Story>

<Story name="Machines">
  {#snippet template()}
    <div class="ui:bg-muted mx-auto grid w-full max-w-5xl grid-cols-1 gap-6 rounded-xl border p-6 md:grid-cols-2">
      <div class="md:col-span-2">
        <MachineTrainingLine label="Lessons move down a line and each one is stamped" class="mx-auto h-80" />
      </div>
      <MachineRepeater label="An expert repeats the same explanation to each new customer" class="h-64" />
      <MachineSpectrum label="A learner rides up five levels to certified training" class="h-64" />
      <MachineCertificatePress label="Certificates are stamped, then checked against a public URL" class="h-64" />
      <MachineBrandStand label="A shop front changes branding for each customer" class="h-64" />
      <MachineEventWire label="Events travel from ClassroomIO to a CRM and a help desk" class="h-64" />
      <MachineGlassBox label="The same mechanism runs in plain sight inside a glass case" class="h-64" />
    </div>
  {/snippet}
</Story>

<Story name="Machine accent and surface">
  {#snippet template()}
    <div class="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div class="ui:bg-muted rounded-xl border p-6">
        <MachineRepeater label="An expert repeats the same explanation to each new customer" class="h-56" />
      </div>
      <div class="rounded-xl border p-6" style="--machine-ink: #16a34a; --machine-face: #f0fdf4; background: #f0fdf4;">
        <MachineRepeater label="An expert repeats the same explanation to each new customer" class="h-56" />
      </div>
    </div>
  {/snippet}
</Story>

<Story name="Machine still frame">
  {#snippet template()}
    <div class="ui:bg-muted mx-auto flex w-full max-w-3xl items-center justify-center gap-6 rounded-xl border p-6">
      <MachineBrandStand stillAt={0} class="h-48" />
      <MachineBrandStand stillAt={6} class="h-48" />
    </div>
  {/snippet}
</Story>
