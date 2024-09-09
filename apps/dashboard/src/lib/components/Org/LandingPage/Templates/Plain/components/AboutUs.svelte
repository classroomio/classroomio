<script>
  import { landingPageSettings } from '$lib/components/Org/Settings/store';
</script>

{#if $landingPageSettings.aboutUs.show}
  <section id="aboutus" class="m-h-[400px] my-10 mx-auto max-w-6xl w-full">
    <div class="mx-4 flex items-center justify-evenly flex-col lg:flex-row">
      <div class="max-w-[600px] lg:w-2/5 mr-5 mb-5 lg:mb-0">
        <h2 class="text-4xl md:text-5xl lg:text-6xl">{$landingPageSettings.aboutUs.title}</h2>
        <p class="mb-2">
          {$landingPageSettings.aboutUs.content}
        </p>
      </div>

      <div class="image">
        <img
          src={$landingPageSettings.aboutUs.imageUrl}
          alt="Our Story"
          class=" rounded-2xl max-h-[450px]"
        />
      </div>
    </div>
  </section>
{/if}
