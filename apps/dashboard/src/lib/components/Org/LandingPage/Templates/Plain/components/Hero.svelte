<script lang="ts">
  import { goto } from '$app/navigation';

  import { landingPageSettings } from '$lib/components/Org/Settings/store';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { t } from '$lib/utils/functions/translations';

  export let org = {};
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
  <div class="flex items-center justify-center py-2 px-10 min-h-full">
    <div
      class="md:w-11/12 lg:w-5/6 w-full flex items-center justify-center md:justify-between flex-col-reverse md:flex-row z-20 relative"
    >
      <!-- Course Description -->
      <div class=" space-y-6 w-full">
        <p class=" text-primary-600 text-2xl font-semibold capitalize">
          {org.name}
        </p>
        <h1 class="text-4xl md:text-5xl lg:text-6xl text-center md:text-start my-4 font-bold">
          {$landingPageSettings.header.title} <br /><span class="text-primary-600"
            >{$landingPageSettings.header.titleHighlight}</span
          >
        </h1>
        <p class="text-md mb-3 md:mb-5 text-xl text-center md:text-start">
          {$landingPageSettings.header.subtitle}
        </p>

        <PrimaryButton
          label={$landingPageSettings.header.action.label}
          className="mt-2 md:mt-5 px-10 w-fit"
          onClick={() => {
            $landingPageSettings.header.action.redirect &&
              goto($landingPageSettings.header.action.link);
          }}
        />
      </div>

      <div
        class="hidden rounded-md h-[280px] max-h-[400px] w-5/6 md:w-1/2 md:max-w-[650px] lg:flex"
      >
        {#if isYouTubeLink($landingPageSettings.header?.banner?.video) && $landingPageSettings.header.banner.type === 'video'}
          <div bind:this={player} id="player" style="width:100%; border-radius:12px">
            <iframe
              title={$t('course.navItem.landing_page.header_video')}
              src={$landingPageSettings.header?.banner?.video}
              allowfullscreen
              allowtransparency
              allow="autoplay"
            />
          </div>
        {:else}
          <!-- <video class="w-full rounded-xl" controls loop autoplay>
                            <source src={$landingPageSettings.header?.banner?.video} type="video/mp4" />
                            <source src="/path/to/video.webm" type="video/webm" />
                            Captions are optional
                            <track kind="captions" />
                          </video> -->
          <img
            class="rounded-md"
            src={$landingPageSettings.header?.banner?.image}
            alt="landing page banner"
          />
        {/if}
      </div>
    </div>
  </div>
{:else}
  <div class="w-full h-full flex items-center justify-center md:flex-row z-20 relative">
    <div class="max-w-[600px] mx-auto w-11/12 py-10 flex flex-col items-center">
      <p class=" text-primary-600 text-2xl font-semibold capitalize">{org.name}</p>
      <h1 class="text-4xl md:text-5xl lg:text-6xl text-center my-4 font-bold">
        {$landingPageSettings.header.title} <br /><span class="text-primary-600"
          >{$landingPageSettings.header.titleHighlight}</span
        >
      </h1>
      <p class="text-md mb-6 text-center text-xl">
        {$landingPageSettings.header.subtitle}
      </p>

      <PrimaryButton
        label={$landingPageSettings.header.action.label}
        className="mt-5 px-10 w-fit"
        onClick={() => {
          $landingPageSettings.header.action.redirect &&
            goto($landingPageSettings.header.action.link);
        }}
      />
    </div>
  </div>
{/if}
