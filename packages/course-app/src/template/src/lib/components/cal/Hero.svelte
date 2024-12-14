<script lang="ts">
  import { goto } from '$app/navigation';
  import PrimaryButton from './PrimaryButton.svelte';
  import { getPageSection } from '$lib/utils/helpers/page';
  import { homePage } from '$lib/utils/stores/pages';
  import bannerImg from './assets/banner.jpeg';
</script>

{#if $homePage}
  {@const content = getPageSection($homePage, 'header')}
  {#if content?.show}
    <section
      class="font-matter flex h-full items-start justify-center bg-[#F4F4F4] px-5 py-10 md:items-center lg:px-20 lg:py-20"
    >
      <section
        class="flex flex-col-reverse items-center justify-center lg:flex-row lg:justify-between"
      >
        <div class="mt-4 w-full space-y-6 text-center lg:mt-0 lg:text-start">
          <div
            class="mx-auto w-fit rounded-sm border-black bg-[#E5E7E0] px-4 py-1 md:border-b lg:mx-0"
          >
            <p class="text-xs font-bold uppercase text-[#0F163F] lg:text-base">
              {content.settings.title}
            </p>
          </div>
          <p
            class="mx-auto w-full text-4xl font-black capitalize md:w-[90%] md:text-6xl lg:mx-0 lg:w-[80%]"
          >
            {content.settings.titleHighlight}
          </p>
          <p class="mx-auto w-full text-xl font-semibold md:w-[80%] lg:mx-0 lg:w-[70%]">
            {content.settings.subtitle}
          </p>

          <PrimaryButton
            onClick={() => {
              goto(content.settings.action.link);
            }}
            label={content.settings.action.label}
          />
        </div>

        <div
          class="relative flex h-[250px] w-[250px] items-center justify-center lg:h-[350px] lg:w-[500px]"
        >
          <svg
            class="absolute -left-[15px] h-[270px] w-[270px] lg:-left-[60px] lg:h-[370px] lg:w-[400px] xl:-left-[100px] xl:w-[520px]"
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
            src={content.settings.banner?.image ?? bannerImg}
            class="h-[250px] w-[250px] rounded-full object-cover lg:h-[350px] lg:w-[500px]"
          />
        </div>
      </section>
    </section>
  {/if}
{/if}
