<script>
  import { landingPageSettings } from '$lib/components/Org/Settings/store';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
</script>

{#if $landingPageSettings.footerNote.show}
  <section
    class="flex flex-col items-center justify-between px-6 lg:px-10 py-20 bg-blue-800 space-y-4"
  >
    <div class="flex items-center justify-center w-full">
      <p class="text-4xl text-white text-center font-serif font-bold w-full lg:w-[70%] capitalize">
        {$landingPageSettings.footerNote.title}
      </p>
    </div>
    <p class="text-white text-center w-full lg:w-[50%]">
      {$landingPageSettings.footerNote.subtitle}
    </p>
    <div class="w-full flex items-center justify-center my-5">
      <PrimaryButton
        label={$landingPageSettings.footerNote.buttonLabel}
        variant={VARIANTS.CONTAINED_WHITE}
        className="rounded-none font-bold text-lg bg-white text-blue-700 uppercase"
      />
    </div>
  </section>
{/if}
