<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { Waves } from '@cio/ui/custom/animation/waves';

  interface Props {
    header?: string;
    subText?: string;
    btnLabel?: string;
    link?: string;
    demo?: boolean;
  }

  let { header = '', subText = '', btnLabel = '', link = '', demo = true }: Props = $props();
</script>

<div
  class="relative mx-auto my-5 flex h-[61vh] w-full max-w-4xl flex-col items-center justify-center overflow-hidden bg-gray-950 px-6 py-12 text-center shadow-2xl lg:h-[50vh] lg:w-[70%] lg:rounded-3xl"
>
  <div class="cio-cta-radial-bg pointer-events-none absolute inset-0 z-0 h-full w-full" aria-hidden="true"></div>
  <Waves
    lineColor="rgba(255,255,255,0.18)"
    class="ui:pointer-events-none ui:absolute ui:inset-0 ui:h-full ui:w-full"
    xGap={14}
    yGap={34}
    waveAmpX={24}
    waveAmpY={12}
    maxCursorMove={72}
  />
  <div
    class="pointer-events-none absolute inset-0 bg-linear-to-t from-gray-950/40 via-transparent to-white/[0.04]"
  ></div>

  <div class="relative z-10 flex w-full flex-col items-center text-center">
    <h3 class="font-display mx-auto mt-3 max-w-2xl text-center text-xl tracking-tight text-white lg:mt-2 lg:text-4xl">
      {header}
    </h3>
    <p class="text-md mx-auto mt-6 max-w-2xl text-center text-gray-300">
      {subText}
    </p>
  </div>

  {#if demo}
    <Button
      variant="ghost"
      data-cal-config="'layout':'month_view'"
      data-cal-link="classroomio/demo"
      class="relative z-10 mt-8 bg-white!"
    >
      {btnLabel}
    </Button>
  {:else}
    <Button
      href={link}
      variant="link"
      target="_blank"
      class="ui:bg-secondary ui:text-secondary-foreground relative z-10 mt-8"
      rel="noopener noreferrer nofollow"
    >
      {btnLabel}
    </Button>
  {/if}
</div>
