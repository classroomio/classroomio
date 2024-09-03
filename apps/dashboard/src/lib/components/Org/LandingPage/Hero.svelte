<script lang="ts">
  import { goto } from '$app/navigation';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { landingPageSettings } from '../Settings/store';

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
  <section class="flex items-center justify-center py-2 px-14 border border-red-500 min-h-screen">
    <section class="flex items-center justify-between">
      <div class="text-white space-y-6 w-full">
        <span
          class="bg-[#DCFCFFED] py-1 px-3 uppercase border rounded-sm text-center font-semibold text-base text-[#0F163F]"
          >{$landingPageSettings.header.title}</span
        >
        <p class="text-4xl font-semibold w-[70%]">
          {$landingPageSettings.header.titleHighlight}
        </p>
        <p class="w-[70%]">
          {$landingPageSettings.header.subtitle}
        </p>
        <PrimaryButton
          className="rounded-none uppercase"
          label={$landingPageSettings.header.action.label}
          onClick={() => {
            $landingPageSettings.header.action.redirect &&
              goto($landingPageSettings.header.action.link);
          }}
        />
      </div>
      <div class="rounded-md h-[280px] max-h-[400px] w-5/6 md:w-1/2 md:max-w-[650px] flex">
        {#if isYouTubeLink($landingPageSettings.header?.banner?.video) && $landingPageSettings.header.banner.type === 'video'}
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
              : '/images/classroomio-course-img-template.jpg'}
            class="mt-2 h-full max-h-[400px] w-full max-w-[500px] rounded-md md:mt-0"
          />
        {/if}
      </div>
    </section>
  </section>
{/if}
