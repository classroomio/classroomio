<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { MachineBrandStand, MachineGlassBox, MachineRepeater } from '@cio/ui/custom/animation/machines';
  import { PLANS } from '@cio/utils/plans';

  type Variant = 'expert' | 'pricing' | 'brand';

  interface Props {
    header?: string;
    subText?: string;
    btnLabel?: string;
    link?: string;
    demo?: boolean;
    variant?: Variant;
  }

  let { header = '', subText = '', btnLabel = '', link = '', demo = true, variant = 'expert' }: Props = $props();

  const glassBoxPrice = `${PLANS.EARLY_ADOPTER.PRICE.CURRENCY}${PLANS.EARLY_ADOPTER.PRICE.MONTHLY}/mo`;
  const isBrand = $derived(variant === 'brand');

  const LAYOUT_CLASS: Record<Variant, string> = {
    expert: 'grid items-center gap-10 px-6 py-12 md:px-10 lg:grid-cols-[500px_1fr] lg:py-12 lg:pr-10 lg:pl-14',
    pricing: 'grid items-center gap-10 px-6 py-12 md:px-10 lg:grid-cols-[1fr_500px] lg:py-12 lg:pr-14 lg:pl-10',
    brand: 'flex flex-col items-center gap-9 px-6 pt-14 pb-10 text-center md:px-10'
  };
</script>

{#snippet copy()}
  <div class="flex flex-col gap-5 {isBrand ? 'items-center' : 'items-start'}">
    <h2
      class="text-[clamp(30px,3.6vw,46px)] leading-[1.05] font-semibold tracking-[-0.04em] text-balance text-gray-950"
    >
      {header}
    </h2>
    <p class="max-w-[620px] text-lg leading-[1.55] text-[#4A443A]">{subText}</p>
    <div class="flex flex-wrap gap-3">
      {#if demo}
        <Button data-cal-config="'layout':'month_view'" data-cal-link="classroomio/demo">
          {btnLabel}
        </Button>
      {:else}
        <Button href={link} target="_blank" rel="noopener noreferrer nofollow">
          {btnLabel}
        </Button>
      {/if}
    </div>
  </div>
{/snippet}

<div class="px-6 py-20 md:px-10 md:py-28">
  <div class="cta-band max-w-content relative mx-auto rounded-md bg-[#F1EEE7] {LAYOUT_CLASS[variant]}">
    {#if variant === 'expert'}
      {@render copy()}
      <div class="h-[300px] p-[18px] md:h-[400px] lg:h-[460px]">
        <MachineRepeater label="An educator in the centre repeating the same explanation to each new learner" />
      </div>
    {:else if variant === 'pricing'}
      <div class="order-last h-[300px] p-[18px] md:h-[400px] lg:order-first lg:h-[440px]">
        <MachineGlassBox
          label="ClassroomIO running inside a glass case with a monthly price tag and a self-host option"
          price={glassBoxPrice}
        />
      </div>
      {@render copy()}
    {:else}
      {@render copy()}
      <div class="h-[260px] w-full p-[18px] md:h-[360px] lg:h-[420px]">
        <MachineBrandStand label="Three academy brands rotating on one stand, each on its own domain" />
      </div>
    {/if}

    <span aria-hidden="true" class="cio-notch pointer-events-none absolute -top-px left-7 h-[11px] w-[46px] bg-white"
    ></span>
  </div>
</div>

<style>
  .cta-band {
    --machine-ink: var(--color-blue-700);
    --machine-face: #f1eee7;
  }
</style>
