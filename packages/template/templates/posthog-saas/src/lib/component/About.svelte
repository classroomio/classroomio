<script>
  import { CheckmarkFilled } from 'carbon-icons-svelte';

  export let data;
</script>

{#if data.aboutUs.show}
  <section id="course" class="px-4 md:px-8 pt-4 pb-20 h-full lg:px-10 w-full mx-auto lg:w-[80%]">
    <h1 class="text-start text-3xl mb-2 font-bold">{data.aboutUs.title}</h1>
    <p class="text-start text-[#3D3D3D] dark:text-white text-sm font-semibold md:w-[70%] mb-8">
      {data.aboutUs.subtitle}
    </p>
    <div>
      <p class="text-xl font-bold capitalize">{data.aboutUs.benefits.title}</p>
      <section class="flex flex-wrap justify-center items-start md:justify-start w-full gap-6 py-4">
        {#each data.aboutUs.benefits.list as item}
          <div
            class="flex flex-col gap-2 p-4 bg-[#E5E7E0] dark:bg-[#232429] border border-[#D0D1C9] h-[150px] max-h-[200px] w-full max-w-[300px] lg:max-w-[450px] rounded-lg overflow-hidden"
          >
            <span class="flex items-center gap-2">
              <CheckmarkFilled size={24} class=" fill-[#F54E00] dark:fill-[#EB9D2A]" />
              <p class="text-lg font-bold capitalize line-clamp-1">{item.title}</p>
            </span>
            <p class="text-sm line-clamp-4">{item.subtitle}</p>
          </div>
        {/each}
      </section>
    </div>
  </section>
{/if}
