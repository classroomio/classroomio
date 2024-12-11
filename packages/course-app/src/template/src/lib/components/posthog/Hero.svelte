<script lang="ts">
  import { goto } from '$app/navigation';
  import { Button } from '$lib/components/ui/button';
  import { getPageSection } from '$lib/utils/helpers/page';
  import { homePage } from '$lib/utils/stores/pages';

  import PrimaryButton from './PrimaryButton.svelte';
  import banner from './static/posthog.svg';
</script>

{#if $homePage}
  {@const content = getPageSection($homePage, 'header')}
  {#if content?.show}
    <section
      class="font-matter flex items-center justify-center py-10 px-10 md:px-14 min-h-full overflow-hidden"
    >
      <section
        class="flex flex-col-reverse md:flex-col text-center items-center gap-5 justify-center"
      >
        <div class="space-y-6 w-full mb-4">
          <p class="text-3xl md:text-5xl font-bold w-full md:w-[80%] lg:w-[70%] mx-auto">
            {content.settings.title}
          </p>

          <p class="w-full text-lg font-semibold md:w-[80%] lg:w-[70%] mx-auto">
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
          class=" relative rounded-lg h-fit md:h-[300px] md:max-h-[350px] w-full md:w-[800px] md:max-w-[80vw] lg:max-w-[80%] flex"
        >
          <span class="absolute w-2 h-2 rounded-full bg-red-500 -top-14 left-3"></span>
          <span class="absolute w-2 h-2 rounded-full bg-white top-10 -left-10"></span>
          <span class="absolute w-2 h-2 rounded-full bg-yellow-500 -top-10 -right-3"></span>
          <span class="absolute w-2 h-2 rounded-full bg-blue-800 top-14 -right-10"></span>

          <div class="flex items-center justify-center">
            <img
              style="min-width:280px; min-height:200px"
              alt="landing page banner"
              src={content.settings.banner.image ? content.settings.banner.image : banner}
              class="h-[150px] md:h-full max-h-full w-full rounded-lg object-cover"
            />
          </div>
        </div>
      </section>
    </section>
  {/if}
{/if}
