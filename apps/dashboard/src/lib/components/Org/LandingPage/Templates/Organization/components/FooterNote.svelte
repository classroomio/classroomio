<script>
  import { landingPageSettings } from '$lib/components/Org/Settings/store';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
</script>

{#if $landingPageSettings.footerNote.show}
  <section class="flex flex-col items-center justify-between px-6 lg:px-10 py-20 bg-[#CE02CE]">
    <div class="flex items-center justify-center w-full">
      <p class="text-4xl text-white text-center font-bold w-full">
        {$landingPageSettings.footerNote.title}
      </p>
    </div>
    <div class="w-full flex items-center justify-center my-5">
      <PrimaryButton
        label={$landingPageSettings.footerNote.buttonLabel}
        variant={VARIANTS.NONE}
        className="rounded-sm font-bold text-lg !bg-[#FFE8FF] !text-[#CE02CE] border border-[#FFF9F9] "
      />
    </div>
  </section>
{/if}
