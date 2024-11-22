<script lang="ts">
  import { goto } from '$app/navigation';
  import Button from '$lib/components/ui/button/button.svelte';
  import { getPageSection } from '$lib/utils/helpers/page';
  import { homePage } from '$lib/utils/stores/pages';

  const content = $derived(getPageSection($homePage, 'header'));
</script>

{#if content?.show}
  <section
    class="font-matter flex items-start md:items-center justify-center py-10 lg:py-20 px-5 lg:px-20 h-full bg-[#F4F4F4]"
  >
    <section
      class="flex flex-col-reverse lg:flex-row items-center justify-center lg:justify-between"
    >
      <div class="text-center lg:text-start space-y-6 w-full mt-4 lg:mt-0">
        <div
          class="bg-[#E5E7E0] py-1 px-4 md:border-b border-black rounded-sm w-fit mx-auto lg:mx-0"
        >
          <p class="uppercase font-bold text-xs lg:text-base text-[#0F163F]">
            {content.settings.title}
          </p>
        </div>
        <p
          class="text-4xl md:text-6xl font-black w-full mx-auto lg:mx-0 md:w-[90%] lg:w-[80%] capitalize"
        >
          {content.settings.titleHighlight}
        </p>
        <p class="font-semibold text-xl w-full md:w-[80%] mx-auto lg:mx-0 lg:w-[70%]">
          {content.settings.subtitle}
        </p>

        <Button
          class="uppercase rounded-2xl py-6 bg-white hover:bg-white hover:text-black border-[1.5px] border-[#141414] text-[#141414] shadow-[0px_3px_#141414]"
          on:click={() => {
            goto(content.settings.action.link);
          }}
        >
          {content.settings.action.label}
        </Button>
      </div>

      <div
        class="relative w-[250px] h-[250px] lg:w-[500px] lg:h-[350px] flex items-center justify-center"
      >
        <svg
          class="absolute -left-[15px] lg:-left-[60px] xl:-left-[100px] w-[270px] h-[270px] lg:w-[400px] xl:w-[520px] lg:h-[370px]"
          viewBox="0 0 360 360"
        >
          <circle
            cx="180"
            cy="180"
            r="170"
            fill="none"
            stroke="#282828"
            stroke-width="2"
            stroke-dasharray="15, 10"
          />
        </svg>
        <img
          alt="landing page banner"
          src={content.settings.banner?.image
            ? content.settings.banner?.image
            : '/calcom-banner-img.jpeg'}
          class="object-cover rounded-full w-[250px] h-[250px] lg:w-[500px] lg:h-[350px]"
        />
      </div>
    </section>
  </section>
{/if}
