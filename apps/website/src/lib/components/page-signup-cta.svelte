<script lang="ts">
  import CtaButton from './ui/cta-button.svelte';

  interface Props {
    header?: string;
    subText?: string;
    btnLabel?: string;
    link?: string;
    demo?: boolean;
  }

  let { header = '', subText = '', btnLabel = '', link = '', demo = true }: Props = $props();
</script>

<div class="px-6 py-20 md:px-10 md:py-28">
  <div
    class="max-w-content relative mx-auto flex w-full flex-col items-center overflow-hidden rounded-md bg-gray-950 px-6 py-20 text-center md:px-16 md:pt-[104px] md:pb-24"
  >
    <div class="cio-cta-radial-bg pointer-events-none absolute inset-0" aria-hidden="true"></div>
    <div class="cio-iso-grid pointer-events-none absolute inset-0" aria-hidden="true"></div>

    <h3 class="text-cta relative max-w-[900px] text-balance text-white">
      {header}
    </h3>
    <p class="text-lead relative mt-5 max-w-[640px] text-gray-300">
      {subText}
    </p>

    <div class="relative mt-9">
      {#if demo}
        <CtaButton variant="inverse" data-cal-config="'layout':'month_view'" data-cal-link="classroomio/demo">
          {btnLabel}
        </CtaButton>
      {:else}
        <CtaButton variant="inverse" href={link} target="_blank" rel="noopener noreferrer nofollow">
          {btnLabel}
        </CtaButton>
      {/if}
    </div>

    <span aria-hidden="true" class="cio-notch pointer-events-none absolute -top-px left-7 h-[11px] w-[46px] bg-white"
    ></span>
  </div>
</div>
