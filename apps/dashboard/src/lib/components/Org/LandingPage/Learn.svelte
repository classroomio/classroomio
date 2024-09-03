<script>
  import { landingPageSettings } from '../Settings/store';
</script>

{#if $landingPageSettings.aboutUs.show}
  <section class="flex items-start justify-center p-2 h-full bg-white py-20">
    <section class="flex items-start justify-between w-[90%]">
      <div class="w-[60%] space-y-4">
        <p class="text-4xl font-bold">{$landingPageSettings.aboutUs.title}</p>
        <p class="w-[80%] text-base leading-7 text-[#878787]">
          {$landingPageSettings.aboutUs.content}
        </p>
      </div>
      {#if $landingPageSettings.aboutUs.benefits}
        <div class="w-[40%] space-y-8">
          <span
            class="bg-[#DCFCFF] py-1 px-3 uppercase border border-[#0233BD] rounded-sm text-center font-bold text-base text-[#0233BD]"
            >{$landingPageSettings.aboutUs.benefits.title}</span
          >
          <ul class="space-y-6 text-base text-[#696969] font-medium">
            {#each $landingPageSettings.aboutUs.benefits.list as items}
              <li class="border-l border-[#0233BD] pl-3">{items}</li>
            {/each}
          </ul>
        </div>
      {:else}
        <img
          src={$landingPageSettings.aboutUs.imageUrl}
          alt="Our Story"
          class=" rounded-2xl max-h-[450px]"
        />
      {/if}
    </section>
  </section>
{/if}
