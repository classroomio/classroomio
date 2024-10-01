<script lang="ts">
  import { goto } from '$app/navigation';
  import { landingPageSettings } from '$lib/components/Org/Settings/store';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';

  let player;

  function isYouTubeLink(link: string) {
    const youtubeRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

    return youtubeRegex.test(link.trim());
  }

  function initPlyr(_player: any, _video: string | undefined) {
    if (!player) return;

    // @ts-ignore
    const plyr = new Plyr('#player', { width: '400px', height: '300px', borderRadius: '10px' });
    // @ts-ignore
    window.player = plyr;
  }
  $: initPlyr(player, $landingPageSettings.header?.banner?.video);
</script>

{#if $landingPageSettings.header.banner.show}
  <section class="flex items-start justify-center pb-20 lg:pt-20 pt-4 px-10 md:px-14 h-full">
    <section
      class="flex flex-col-reverse md:flex-row items-start md:items-center gap-10 md:justify-between"
    >
      <div class="space-y-6 w-full">
        <p class="text-4xl xl:text-6xl font-bold w-full xl:w-[70%]">
          {$landingPageSettings.header.title}
          <span class="text-[#CE02CE]">
            {$landingPageSettings.header.titleHighlight}
          </span>
        </p>
        <p class="w-full lg:w-[70%] text-[#878787] xl:text-lg">
          {$landingPageSettings.header.subtitle}
        </p>
        <PrimaryButton
          className="!bg-[#CE02CE] rounded-none uppercase text-white font-semibold"
          variant={VARIANTS.NONE}
          label={$landingPageSettings.header.action.label}
          onClick={() => {
            $landingPageSettings.header.action.redirect &&
              goto($landingPageSettings.header.action.link);
          }}
        />
      </div>
      <div class="rounded-md md:h-[280px] max-h-full w-full md:w-1/2 md:max-w-[800px] flex">
        <!-- {#if isYouTubeLink($landingPageSettings.header?.banner?.video) && $landingPageSettings.header.banner.type === 'video'}
          <div bind:this={player} id="player" style="width:100%; height:100%; border-radius:12px">
            <iframe
              title={$t('course.navItem.landing_page.header_video')}
              src={$landingPageSettings.header?.banner?.video}
              allowfullscreen
              allowtransparency
              allow="autoplay"
            />
          </div> -->
        <!-- </div> -->
        <!-- {:else} -->
        <img
          style="min-width:280px; min-height:200px"
          alt="landing page banner"
          src={$landingPageSettings.header?.banner?.image
            ? $landingPageSettings.header?.banner?.image
            : '/org-banner.png'}
          class="object-cover mt-2 h-full max-h-[500px] w-full max-w-[800px] rounded-md md:mt-0"
        />
        <!-- {/if} -->
      </div>
    </section>
  </section>
{/if}
