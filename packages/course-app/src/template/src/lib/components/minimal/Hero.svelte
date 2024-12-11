<script lang="ts">
  import { goto } from '$app/navigation';
  import { homePage } from '@/utils/stores/pages';
  import PrimaryButton from './PrimaryButton.svelte';
  import { getPageSection } from '@/utils/helpers/page';
  import defaultBanner from './assets/classroomio-course-img-template.jpg';

  let player = $state();

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

  $effect(() => {
    let content = getPageSection($homePage, 'header');
    if (content) {
      initPlyr(player, content.settings?.banner?.video);
    }
  });
</script>

{#if $homePage}
  {@const content = getPageSection($homePage, 'header')}
  {#if content?.show}
    <section class="flex items-center justify-center py-2 px-10 md:px-14 min-h-screen">
      <section class="flex items-center justify-between">
        <div class="text-white space-y-6 w-full">
          <div class="bg-[#DCFCFFED] py-1 px-3 md:border rounded-sm w-fit">
            <p class="text-center uppercase font-bold text-xs lg:text-base text-[#0F163F]">
              {content.settings?.title}
            </p>
          </div>
          <p class="text-4xl font-bold w-full md:w-[70%] capitalize">
            {content.settings?.titleHighlight}
          </p>
          <p class="w-full md:w-[70%]">
            {content.settings?.subtitle}
          </p>
          <PrimaryButton
            class="rounded-none uppercase bg-blue-900 p-3 hover:bg-blue-900 hover:scale-95 font-bold"
            onClick={() => {
              goto(content.settings?.action.link);
            }}
            label={content.settings?.action.label}
          />
        </div>
        <div
          class="hidden rounded-md h-[280px] max-h-[400px] w-5/6 md:w-1/2 md:max-w-[650px] lg:flex"
        >
          {#if isYouTubeLink(content.settings?.banner?.video) && content.settings?.banner.type === 'video'}
            <!-- <div class="w-5/6 md:w-1/2 md:max-w-[650px] flex"> -->
            <div bind:this={player} id="player" style="width:100%; height:100%; border-radius:12px">
              <iframe
                title="video"
                src={content.settings?.banner?.video}
                allowfullscreen
                allowtransparency
                allow="autoplay"
              ></iframe>
            </div>
            <!-- </div> -->
          {:else}
            <img
              style="min-width:280px; min-height:200px"
              alt="landing page banner"
              src={content.settings?.banner?.image
                ? content.settings?.banner?.image
                : defaultBanner}
              class="mt-2 h-full max-h-[400px] w-full max-w-[500px] rounded-md md:mt-0"
            />
          {/if}
        </div>
      </section>
    </section>
  {/if}
{/if}
