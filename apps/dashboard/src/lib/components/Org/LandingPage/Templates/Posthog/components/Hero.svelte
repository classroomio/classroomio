<script>
  import { goto } from '$app/navigation';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';

  import { landingPageSettings } from '$lib/components/Org/Settings/store';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { t } from '$lib/utils/functions/translations';

  let player;

  function isYouTubeLink(video) {
    return true;
  }
</script>

{#if $landingPageSettings.header.banner.show}
  <section class="flex items-center justify-center py-10 px-10 md:px-14 min-h-full">
    <section class="flex flex-col text-center items-center gap-5 justify-center">
      <div class="space-y-6 w-full">
        <p class="text-3xl md:text-5xl font-bold w-full md:w-[70%] mx-auto">
          {$landingPageSettings.header.title}
        </p>

        <p class="w-full text-lg font-semibold md:w-[70%] mx-auto">
          {$landingPageSettings.header.subtitle}
        </p>
      </div>
      <PrimaryButton
        className="rounded-md uppercase !ring-1 !ring-[#B17816] dark:!bg-[#EB9D2A] hover:bg-[#EB9D2A] shadow-[0px_3px_#B17816] font-semibold mb-4"
        variant={VARIANTS.NONE}
        label={$landingPageSettings.header.action.label}
        onClick={() => {
          $landingPageSettings.header.action.redirect &&
            goto($landingPageSettings.header.action.link);
        }}
      />
      <div
        class="relative rounded-lg h-[300px] max-h-[350px] w-[800px] max-w-[80vw] lg:max-w-[80%] flex"
      >
        <span class="absolute w-2 h-2 rounded-full bg-red-500 -top-14 left-3" />
        <span class="absolute w-2 h-2 rounded-full bg-white top-10 -left-10" />
        <span class="absolute w-2 h-2 rounded-full bg-yellow-500 -top-10 -right-3" />
        <span class="absolute w-2 h-2 rounded-full bg-blue-800 top-14 -right-10" />
        {#if !isYouTubeLink($landingPageSettings.header?.banner?.video) && $landingPageSettings.header.banner.type === 'video'}
          <!-- <div class="w-5/6 md:w-1/2 md:max-w-[650px] flex"> -->
          <div bind:this={player} id="player" style="width:100%; height:100%; border-radius:12px">
            <iframe
              title={$t('course.navItem.landing_page.header_video')}
              src={$landingPageSettings.header?.banner?.video}
              allowfullscreen
              allowtransparency
              allow="autoplay"
            />
          </div>
          <!-- </div> -->
        {:else}
          <img
            style="min-width:280px; min-height:200px"
            alt="landing page banner"
            src={$landingPageSettings.header?.banner?.image
              ? $landingPageSettings.header?.banner?.image
              : '/posthog.svg'}
            class="h-full max-h-full w-full rounded-lg object-cover"
          />
        {/if}
      </div>
    </section>
  </section>
{/if}
