<script lang="ts">
  import { OpenBackground, closeBackgroundModal, htmlBody, type Source } from './store';

  let backgrounds = [
    {
      src: 'blue_tetiary_background'
    },
    {
      src: 'blue_secondary_background'
    },
    {
      src: 'blue_primary_background'
    },
    {
      src: 'purple_tetiary_background'
    },
    {
      src: 'purple_secondary_background'
    },
    {
      src: 'purple_primary_background'
    },
    {
      src: 'black_tetiary_background'
    },
    {
      src: 'black_secondary_background'
    },
    {
      src: 'black_primary_background'
    },
    {
      src: 'yellow_tetiary_background'
    },
    {
      src: 'yellow_secondary_background'
    },
    {
      src: 'yellow_primary_background'
    }
  ];

  function selectBackground(background: Source) {
    $htmlBody.background = background.src;
  }
</script>

{#if $OpenBackground.open}
  <div class="relative">
    <div class="fixed z-[3000] top-0 left-0 w-full h-full bg-black opacity-[0.7]"></div>
    <div
      class="fixed top-[20%] left-10 md:left-[30%] z-[3001] w-[80%] md:w-[38%] h-full max-h-[60vh] overflow-hidden bg-white rounded-md mx-auto py-6 px-7"
    >
      <!--  -->
      <div class="flex justify-between">
        <h1 class="text-sm font-semibold">Choose your Background</h1>
        <button
          type="button"
          on:click={closeBackgroundModal}
          class="p-2 bg-[#F1F6FF] hover:scale-110 transition-all duration-300 rounded-full w-6"
        >
          <img src="/free-tools/progress-report/close-icon.svg" alt="Close icon" />
        </button>
      </div>

      <!--  -->
      <div
        class="flex flex-wrap justify-between gap-y-3 mt-3 overflow-y-auto overflow-x-hidden h-[85%]"
      >
        {#each backgrounds as background}
          <button
            on:click={() => {
              selectBackground(background);
              closeBackgroundModal();
            }}
            class="flex w-[30%] items-center shadow-sm hover:scale-110 transition-all duration-300"
          >
            <img
              src="https://assets.cdn.clsrio.com/progress-report/backgrounds/{background.src}.png"
              alt=""
              class=""
            />
          </button>
        {/each}
      </div>
      <!--  -->
    </div>
  </div>
{/if}
