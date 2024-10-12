<script lang="ts">
  import { goto } from '$app/navigation';

  export let data;

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
  $: initPlyr(player, data.header?.banner?.video);
</script>

{#if data.header.banner.show}
  <section class="flex items-start justify-center pb-20 lg:pt-10 pt-4 px-10 md:px-14 h-full">
    <section
      class="flex flex-col-reverse md:flex-row items-start md:items-center gap-10 md:justify-between"
    >
      <div class="space-y-6 w-full">
        <p class="text-4xl xl:text-6xl font-bold w-full xl:w-[70%]">
          {data.header.title}
          <span class="text-[#CE02CE]">
            {data.header.titleHighlight}
          </span>
        </p>
        <p class="w-full lg:w-[70%] text-[#878787] xl:text-lg">
          {data.header.subtitle}
        </p>
        <button
          class="bg-[#CE02CE] rounded text-white font-semibold p-2 hover:scale-95"
          on:click={() => {
            data.header.action.redirect && goto(data.header.action.link);
          }}>{data.header.action.label}</button
        >
      </div>
      <div
        class="rounded-md md:h-[300px] xl:h-[500px] max-h-full w-full md:w-1/2 lg:w-4/5 xl:w-[800px] md:max-w-[800px] flex"
      >
        <!-- {#if isYouTubeLink(data.header?.banner?.video) && data.header.banner.type === 'video'}
          <div bind:this={player} id="player" style="width:100%; height:100%; border-radius:12px">
            <iframe
              title={$t('course.navItem.landing_page.header_video')}
              src={data.header?.banner?.video}
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
          src={data.header?.banner?.image ? data.header?.banner?.image : '/org-banner.png'}
          class="object-cover mt-2 h-full w-full rounded-md md:mt-0 border-green-600"
        />
        <!-- {/if} -->
      </div>
    </section>
  </section>
{/if}
