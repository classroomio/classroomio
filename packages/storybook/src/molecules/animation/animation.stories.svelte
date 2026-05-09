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
    SquareCardIcon
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
    <div
      class="ui:relative ui:mx-auto ui:flex ui:h-48 ui:w-80 ui:items-center ui:justify-center ui:rounded-xl ui:border ui:bg-muted"
    >
      <BorderBeam />
      <span class="ui:relative ui:z-10 ui:text-sm ui:font-medium">Border beam</span>
    </div>
  {/snippet}
</Story>

<Story name="DotPattern">
  {#snippet template()}
    <div class="ui:relative ui:mx-auto ui:h-48 ui:w-80 ui:overflow-hidden ui:rounded-xl ui:border ui:bg-background">
      <DotPattern />
      <div class="ui:relative ui:z-10 ui:flex ui:h-full ui:items-center ui:justify-center ui:text-sm">Dot pattern</div>
    </div>
  {/snippet}
</Story>

<Story name="DotField">
  {#snippet template()}
    <div
      class="ui:relative ui:mx-auto ui:h-[500px] ui:w-full ui:max-w-3xl ui:overflow-hidden ui:rounded-xl ui:border ui:bg-background"
    >
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
        class="ui:absolute ui:inset-0 ui:h-full ui:w-full"
      />
      <div class="ui:relative ui:z-10 ui:flex ui:h-full ui:items-center ui:justify-center ui:text-sm">
        Move the cursor over this area
      </div>
    </div>
  {/snippet}
</Story>

<Story name="CardContainer">
  {#snippet template()}
    <CardContainer className="ui:max-w-lg">
      {#snippet children()}
        <CardBody>
          {#snippet children()}
            <p class="ui:text-center ui:text-sm">Card container with body</p>
          {/snippet}
        </CardBody>
      {/snippet}
    </CardContainer>
  {/snippet}
</Story>

<Story name="BlurFade">
  {#snippet template()}
    <div class="ui:p-8">
      <BlurFade>
        {#snippet children()}
          <p class="ui:text-lg">Scroll into view (blur fade)</p>
        {/snippet}
      </BlurFade>
    </div>
  {/snippet}
</Story>

<Story name="BlurIn">
  {#snippet template()}
    <div class="ui:p-8 ui:text-center">
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
    <div
      class="ui:relative ui:mx-auto ui:min-h-64 ui:w-full ui:max-w-xl ui:overflow-visible ui:rounded-xl ui:border ui:bg-slate-950 ui:p-4"
    >
      <Meteors number={12} />
      <p class="ui:relative ui:z-10 ui:p-6 ui:text-center ui:text-sm ui:text-slate-300">
        Meteors (absolute layer behind this copy)
      </p>
    </div>
  {/snippet}
</Story>

<Story name="ShimmerButton">
  {#snippet template()}
    <div class="ui:flex ui:justify-center ui:bg-neutral-950 ui:p-8">
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
    <div class="ui:flex ui:justify-center ui:bg-background ui:p-12">
      <Sparkle text="Sparkle text" sparklesCount={6} />
    </div>
  {/snippet}
</Story>

<Story name="HeroVideoDialog">
  {#snippet template()}
    <div class="ui:mx-auto ui:max-w-2xl ui:p-8">
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
    <div class="ui:flex ui:justify-center ui:bg-background ui:p-12">
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
    <div class="ui:mx-auto ui:h-40 ui:max-w-sm ui:p-4">
      <MagicCard>
        {#snippet children()}
          <p class="ui:text-center ui:text-sm">Hover for gradient</p>
        {/snippet}
      </MagicCard>
    </div>
  {/snippet}
</Story>

<Story name="GradualSpacing">
  {#snippet template()}
    <div class="ui:bg-background ui:p-12">
      <GradualSpacing words="Hello" />
    </div>
  {/snippet}
</Story>

<Story name="SquareCard">
  {#snippet template()}
    <div class="ui:relative ui:mx-auto ui:w-64 ui:rounded-lg ui:border ui:p-6">
      <SquareCardIcon class="ui:right-2 ui:top-2" />
      <SquareCardBody>
        {#snippet children()}
          <p class="ui:text-sm">Square card body with icon</p>
        {/snippet}
      </SquareCardBody>
    </div>
  {/snippet}
</Story>
