<script lang="ts">
  import { goto } from '$app/navigation';
  import { Button } from '$lib/components/ui/button';
  import DirectionStraightRight from 'carbon-icons-svelte/lib/DirectionStraightRight.svelte';

  export let data;
</script>

{#if data.header.banner.show}
  <section class="flex items-center justify-center py-10 px-2 lg:px-14 min-h-full overflow-hidden">
    <section
      class="flex flex-col-reverse md:flex-col text-center items-center gap-5 justify-center"
    >
      <div class="space-y-6 w-full mb-4">
        <p class="text-3xl md:text-6xl font-bold w-full md:w-[90%] mx-auto">
          {data.header.title}
        </p>

        <p class="w-full text-lg md:w-[70%] mx-auto">
          {data.header.subtitle}
        </p>
        <Button
          on:click={() => {
            goto(data.header.action.link);
          }}
          class="bg-[#0737BE] hover:bg-[#0737BE] rounded-none text-white gap-6"
        >
          {data.header.action.label}
          <DirectionStraightRight />
        </Button>
      </div>
    </section>
  </section>
{/if}
