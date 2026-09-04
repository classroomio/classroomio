<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import {
    BlurFade,
    BlurIn,
    BorderBeam,
    CardBody,
    CardContainer,
    DotField,
    DotPattern,
    GradualSpacing,
    HeroVideoDialog,
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
