<script lang="ts">
  import Modal from '$lib/Modal/Modal.svelte';
  import { htmlBody, openModal } from './store';

  interface Background {
    src: string;
  }

  let backgrounds: Background[] = [
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

  function selectBackground(background: Background) {
    $htmlBody.background = background.src;
    $openModal.background = false;
  }
</script>

<Modal className="h-full max-h-[60vh]" bind:open={$openModal.background}>
  <!--  -->
  <div class="flex justify-between">
    <h1 class="text-sm font-semibold">Choose your Background</h1>
    <button
      type="button"
      onclick={() => ($openModal.background = false)}
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
        onclick={() => {
          selectBackground(background);
        }}
        class="flex w-[30%] items-center shadow-sm hover:scale-110 transition-all duration-300"
      >
        <img
          src="https://assets.cdn.clsrio.com/progress-report/backgrounds/{background.src}.webp"
          alt=""
          class=""
        />
      </button>
    {/each}
  </div>
  <!--  -->
</Modal>
