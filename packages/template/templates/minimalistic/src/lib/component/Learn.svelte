<script>
  export let data;
</script>

{#if data.aboutUs.show}
  <section id="about" class="flex items-start justify-center px-10 lg:px-14 h-full bg-white py-20">
    <section class="flex flex-col lg:flex-row gap-8 items-start justify-between">
      <div class="w-full lg:w-[60%] space-y-4">
        <p class="text-4xl font-bold">{data.aboutUs.title}</p>
        <p class="w-full lg:w-[80%] text-base leading-7 text-[#878787]">
          {data.aboutUs.content}
        </p>
      </div>
      {#if data.aboutUs.benefits}
        <div class="w-full lg:w-[40%] space-y-8">
          <span
            class="bg-[#DCFCFF] py-1 px-3 uppercase border border-[#0233BD] rounded-sm text-center font-bold text-base text-[#0233BD]"
            >{data.aboutUs.benefits.title}</span
          >
          <ul class="space-y-6 text-base text-[#696969] font-medium">
            {#each data.aboutUs.benefits.list as items}
              <li class="border-l border-[#0233BD] pl-3">{items.title}</li>
            {/each}
          </ul>
        </div>
      {:else}
        <img src={data.aboutUs.imageUrl} alt="Our Story" class="rounded-2xl max-h-[450px]" />
      {/if}
    </section>
  </section>
{/if}
