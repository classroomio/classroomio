<script lang="ts">
  import { goto } from '$app/navigation';
  import { Button } from '$lib/components/ui/button';
  import DirectionStraightRight from 'carbon-icons-svelte/lib/DirectionStraightRight.svelte';
  import { onMount } from 'svelte';

  export let data;

  let scrollPosition = 0;
  let letters = data.header.title.split('');
  let subtitleLetters = data.header.subtitle.split('');
  const subtitleFadeOffset = letters.length * 3;

  onMount(() => {
    const handleScroll = () => {
      scrollPosition = window.scrollY;
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  });
</script>

{#if data.header.banner.show}
  <section
    class="flex items-center justify-center py-16 px-2 lg:px-14 min-h-[100vh] lg:min-h-full overflow-hidden
           dark:bg-[radial-gradient(ellipse_at_top_right,_rgba(11,92,215,0.6)_1%,_rgba(0,0,0,0.8)_30%,_transparent_40%),radial-gradient(ellipse_at_bottom_left,_rgba(11,92,215,0.3)_10%,_rgba(0,0,0,0.8)_30%,_transparent_50%)]"
  >
    <section
      class="flex flex-col-reverse md:flex-col text-center items-center gap-5 justify-center"
    >
      <div class="space-y-6 w-full mb-4">
        <p class="text-3xl md:text-6xl font-bold w-full md:w-[90%] mx-auto">
          {#each letters as letter, index}
            <span
              style="opacity: {Math.max(0, 1 - (scrollPosition - index * 10) / 50)}"
              class="transition-opacity duration-300"
            >
              {letter}
            </span>
          {/each}
        </p>
        <p class="w-full text-lg md:w-[70%] mx-auto">
          {#each subtitleLetters as letter, index}
            <span
              style="opacity: {Math.max(
                0,
                1 - (scrollPosition - (index * 10 + subtitleFadeOffset)) / 150
              )}"
              class="transition-opacity duration-300"
            >
              {letter}
            </span>
          {/each}
        </p>
        <Button
          on:click={() => {
            goto(data.header.action.link);
          }}
          class="group bg-[#0737BE] hover:bg-[#0737BE] rounded-none text-white gap-6"
        >
          {data.header.action.label}
          <DirectionStraightRight
            class="transition-transform duration-300 group-hover:translate-x-1"
          />
        </Button>
      </div>
    </section>
  </section>
{/if}
