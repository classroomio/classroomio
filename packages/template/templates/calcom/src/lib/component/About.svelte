<script lang="ts">
  import { CheckmarkFilled } from 'carbon-icons-svelte';

  export let data;
</script>

{#if data.aboutUs.show}
  <section id="about" class="relative">
    <div class="absolute inset-0 bg-[#F4F4F4] opacity-60"></div>
    <div class="relative px-4 md:px-10 py-10 h-full w-full mx-auto xl:w-[80%]">
      <h1 class="text-center text-5xl mb-2 font-bold md:w-[60%] mx-auto">{data.aboutUs.title}</h1>
      <p class="text-center dark:text-white text-lg font-semibold md:w-[70%] mb-8 mx-auto">
        {data.aboutUs.subtitle}
      </p>
      <div>
        <section class="flex flex-wrap items-start justify-start w-full gap-6 py-4">
          {#each data.aboutUs.benefits.list as item}
            <div
              class="flex flex-col gap-2 p-4 bg-[#E5E7E0] dark:bg-[#232429] border border-[#D0D1C9] h-[150px] max-h-[200px] w-full max-w-full md:max-w-[320px] lg:max-w-[450px] rounded-lg overflow-hidden"
            >
              <span class="flex items-center gap-2">
                <CheckmarkFilled size={24} />
                <p class="text-lg font-bold capitalize line-clamp-1">{item.title}</p>
              </span>
              <p class="text-sm line-clamp-4">{item.subtitle}</p>
            </div>
          {/each}
        </section>
      </div>
    </div>
  </section>
{/if}
