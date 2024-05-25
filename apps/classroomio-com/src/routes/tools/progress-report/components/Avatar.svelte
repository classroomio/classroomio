<script lang="ts">
  import { OpenAvatar, closeAvatarModal, htmlBody, type Source } from './store';

  let isAddIcon = false;
  let hoveredIndex: number | null = null;

  let avatars = [
    { src: 'avatar_a' },
    { src: 'avatar_u' },
    { src: 'avatar_b' },
    { src: 'avatar_c' },
    { src: 'avatar_d' },
    { src: 'avatar_e' },
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

  function selectAvatar(avatar: Source) {
    $htmlBody.avatar = avatar.src;
  }
</script>

{#if $OpenAvatar.open}
  <div class="relative">
    <!-- black background -->
    <div class="fixed z-[3000] top-0 left-0 w-full h-full bg-black opacity-[0.7]"></div>
    <div
      class="fixed top-[20%] left-10 md:left-[30%] z-[3001] w-[80%] md:w-[43%] bg-white rounded-md mx-auto py-6 px-7"
    >
      <!-- heading -->
      <div class="flex justify-between">
        <h1 class="text-sm font-semibold">Choose your Avatars</h1>
        <button
          type="button"
          on:click={closeAvatarModal}
          class="p-2 bg-[#F1F6FF] hover:scale-110 transition-all duration-300 rounded-full w-6"
        >
          <img src="/free-tools/progress-report/close-icon.svg" alt="Close icon" />
        </button>
      </div>

      <!-- map for each avatar -->
      <div class="flex flex-wrap justify-between gap-y-3 mt-3">
        {#each avatars as avatar, index}
          <button
            on:click={() => {
              selectAvatar(avatar);
              closeAvatarModal();
            }}
            on:mouseenter={() => {
              hoveredIndex = index;
              isAddIcon = true;
            }}
            on:mouseleave={() => {
              hoveredIndex = null;
              isAddIcon = false;
            }}
            class="relative w-[17%] flex justify-center items-center shadow-sm rounded-full hover:scale-110 transition-all duration-300"
          >
            <!-- + icon overlay -->
            {#if isAddIcon && hoveredIndex === index}
              <div
                class="w-full h-full flex justify-center items-center bg-white border absolute rounded-full opacity-[0.7] blur-md"
              ></div>
              <img src="/free-tools/progress-report/hover-plus-icon.svg" alt="" class="absolute" />
            {/if}
            <!-- avatar -->
            <img
              src="https://assets.cdn.clsrio.com/progress-report/avatars/{avatar.src}.svg"
              alt=""
              class="w-full"
            />
          </button>
        {/each}
      </div>
      <!--  -->
    </div>
  </div>
{/if}
