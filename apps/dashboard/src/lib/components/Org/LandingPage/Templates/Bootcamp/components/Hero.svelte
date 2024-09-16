<script lang="ts">
  import { goto } from '$app/navigation';
  import { landingPageSettings } from '$lib/components/Org/Settings/store';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { t } from '$lib/utils/functions/translations';

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
  <section class="flex items-center justify-center py-10 px-10 md:px-14 min-h-full">
    <section class="flex flex-col text-center items-center gap-5 justify-center">
      <div class="text-white space-y-6 w-full">
        <span class="text-4xl font-normal w-[70%] mx-auto">{$landingPageSettings.header.title}</span
        >

        <p class="w-full font-normal md:w-[70%] mx-auto">
          {$landingPageSettings.header.subtitle}
        </p>
      </div>
      <div class="rounded-md h-[250px] max-h-[300px] w-[800px] max-w-[80vw] lg:max-w-[80%] flex">
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
              : '/images/classroomio-course-img-template.jpg'}
            class="h-full max-h-[300px] w-full rounded-md object-cover"
          />
        {/if}
      </div>

      <PrimaryButton
        className="rounded-none uppercase !bg-[#00E577] font-semibold"
        variant={VARIANTS.NONE}
        label={$landingPageSettings.header.action.label}
        onClick={() => {
          $landingPageSettings.header.action.redirect &&
            goto($landingPageSettings.header.action.link);
        }}
      />
    </section>
  </section>
{/if}
