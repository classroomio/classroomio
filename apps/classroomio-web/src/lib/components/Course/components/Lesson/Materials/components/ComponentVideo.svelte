<script lang="ts">
  import { formatYoutubeVideo } from '$lib/utils/functions/formatYoutubeVideo';
  import { lesson } from '../../store/lessons';

  let errors = {};
  let player = null;

  function initPlyr(_player: any, _video: string | undefined) {
    if (!_player) return;

    const players = Array.from(document.querySelectorAll('.plyr-video-trigger')).map((p) => {
      // @ts-ignore
      return new Plyr(p);
    });

    // @ts-ignore
    window.players = players;
  }

  $: initPlyr(player, $lesson.materials.videos);
</script>

{#if $lesson.materials.videos.length}
  <div class="w-full">
    {#each $lesson.materials.videos as video}
      <div class="w-full overflow-hidden mb-5">
        {#key video.link}
          <div class="mb-5">
            {#if video.type === 'youtube'}
              <iframe
                class="iframe"
                src={formatYoutubeVideo(video.link, errors)}
                title="YouTube video player"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
              />
            {:else if video.metadata?.svid}
              <div style="position:relative;padding-bottom:51.416579%">
                <iframe
                  src="https://muse.ai/embed/{video.metadata
                    ?.svid}?logo=https://app.classroomio.com/logo-512.png&subtitles=auto&cover_play_position=center"
                  style="width:100%;height:100%;position:absolute;left:0;top:0"
                  frameborder="0"
                  allowfullscreen
                  title="Muse AI Video Embed"
                />
              </div>
            {:else}
              <video bind:this={player} class="plyr-video-trigger" playsinline controls>
                <source src={video.link} type="video/mp4" />
                <track kind="captions" />
              </video>
            {/if}
          </div>
        {/key}
      </div>
    {/each}
  </div>
{/if}

<style>
  .iframe {
    width: 100%;
    height: 450px;
  }
  @media (max-width: 760px) {
    .iframe {
      height: 209px;
    }
  }
</style>
