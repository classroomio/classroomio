<script lang="ts">
  import { goto } from '$app/navigation';
  import { landingPageSettings } from '$lib/components/Org/Settings/store';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
</script>

{#if $landingPageSettings.header.banner.show}
  <section class="flex items-start justify-center pb-20 lg:pt-20 pt-4 px-10 lg:px-20 h-full">
    <section
      class="flex flex-col-reverse md:flex-row items-start md:items-center gap-5 md:justify-between"
    >
      <div class="space-y-6 w-full">
        <p
          class="text-2xl xl:text-5xl text-[#3D3D3D] font-semibold font-playfair first-line:w-full xl:w-[60%]"
        >
          {$landingPageSettings.header.title}
        </p>
        <p class="w-full lg:w-[70%] text-[#656565] font-inter xl:text-lg">
          {$landingPageSettings.header.subtitle}
        </p>
        <PrimaryButton
          className="!bg-[#0233BD] rounded-none uppercase text-white font-semibold font-playfair"
          variant={VARIANTS.NONE}
          label={$landingPageSettings.header.action.label}
          onClick={() => {
            $landingPageSettings.header.action.redirect &&
              goto($landingPageSettings.header.action.link);
          }}
        />
      </div>

      <div
        class="rounded-md md:h-[400px] max-h-full w-full md:w-1/2 md:max-w-[800px] flex shadow-[-12px_12px_0px_#0233BD]"
      >
        <img
          style="min-width:280px; min-height:200px"
          alt="landing page banner"
          src={$landingPageSettings.header?.banner?.image
            ? $landingPageSettings.header?.banner?.image
            : '/org-banner.png'}
          class="object-cover mt-2 h-full max-h-[550px] w-full max-w-[800px] rounded-md md:mt-0"
        />
      </div>
    </section>
  </section>
{/if}
