<script lang="ts">
  import { openModal, htmlBody } from './store';
  import * as Dialog from '@cio/ui/base/dialog';

  interface Avatar {
    src: string;
  }

  let isAddIcon = $state(false);
  let hoveredIndex: number | null = $state(null);

  let avatars: Avatar[] = [
    { src: 'avatar_a' },
    { src: 'avatar_b' },
    { src: 'avatar_c' },
    { src: 'avatar_d' },
    { src: 'avatar_e' },
    { src: 'avatar_f' },
    { src: 'avatar_g' },
    { src: 'avatar_h' },
    { src: 'avatar_i' },
    { src: 'avatar_j' },
    { src: 'avatar_k' },
    { src: 'avatar_l' },
    { src: 'avatar_m' },
    { src: 'avatar_n' },
    { src: 'avatar_o' },
    { src: 'avatar_p' },
    { src: 'avatar_q' },
    { src: 'avatar_r' },
    { src: 'avatar_s' },
    { src: 'avatar_t' }
  ];

  function selectAvatar(avatar: Avatar) {
    $htmlBody.avatar = avatar.src;
    $openModal.avatar = false;
  }
</script>

<Dialog.Root bind:open={$openModal.avatar}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Choose your Avatars</Dialog.Title>
    </Dialog.Header>

    <!-- map for each avatar -->
    <div class="mt-3 flex flex-wrap justify-evenly gap-y-3">
      {#each avatars as avatar, index}
        <button
          onclick={() => {
            selectAvatar(avatar);
          }}
          onmouseenter={() => {
            hoveredIndex = index;
            isAddIcon = true;
          }}
          onmouseleave={() => {
            hoveredIndex = null;
            isAddIcon = false;
          }}
          class="relative flex w-[17%] items-center justify-center rounded-full shadow-sm transition-all duration-300 hover:scale-110"
        >
          <!-- + icon overlay -->
          {#if isAddIcon && hoveredIndex === index}
            <div
              class="absolute flex h-full w-full items-center justify-center rounded-full border bg-white opacity-[0.7] blur-md"
            ></div>
            <img src="/free-tools/progress-report/hover-plus-icon.svg" alt="" class="absolute" />
          {/if}
          <!-- avatar -->
          <img src="https://assets.cdn.clsrio.com/progress-report/avatar/{avatar.src}.svg" alt="" class="w-full" />
        </button>
      {/each}
    </div>
    <!--  -->
  </Dialog.Content>
</Dialog.Root>
