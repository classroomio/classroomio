<script lang="ts">
  import Santa from './santa.svg';
  import { BorderBeam } from '$lib/components/animation/border-beam';
  import { DotPattern } from '$lib/components/animation/dot-pattern';
  import { BuyTemplate } from '$lib/components/buy-template';
</script>

<div
  id="custom-template-card"
  class="group relative mb-5 flex h-full w-full max-w-[340px] flex-col items-center justify-center rounded-md border px-4 py-2 shadow-2xl transition-all duration-500"
>
  <BorderBeam />
  <DotPattern />
  <img src={Santa} alt="Santa" class="z-20 h-28 w-28" />
  <h3 class="z-20 mb-6 text-center font-sans text-5xl font-bold">Buy A Custom Template</h3>

  <BuyTemplate ctaLabel="Learn More" />
</div>
