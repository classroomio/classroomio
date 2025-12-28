<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
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

<Dialog.Root bind:open={$openModal.background}>
  <Dialog.Content class="h-full max-h-[60vh]">
    <Dialog.Header>
      <Dialog.Title>Choose your Background</Dialog.Title>
    </Dialog.Header>

    <!--  -->
    <div class="mt-3 flex h-[85%] flex-wrap justify-between gap-y-3 overflow-x-hidden overflow-y-auto">
      {#each backgrounds as background}
        <button
          onclick={() => {
            selectBackground(background);
          }}
          class="flex w-[30%] items-center shadow-sm transition-all duration-300 hover:scale-110"
        >
          <img src="https://assets.cdn.clsrio.com/progress-report/backgrounds/{background.src}.webp" alt="" class="" />
        </button>
      {/each}
    </div>
    <!--  -->
  </Dialog.Content>
</Dialog.Root>
