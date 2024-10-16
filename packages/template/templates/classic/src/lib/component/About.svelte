<script>
  export let data;
</script>

{#if data.aboutUs.show}
  <section
    id="about"
    class="flex items-start justify-center px-10 lg:px-14 h-full bg-white border-b-2 pb-20 lg:pt-20 pt-4"
  >
    <section class="flex flex-col lg:flex-row gap-4 items-center lg:items-start justify-center">
      <div class="w-full lg:w-[60%] space-y-4">
        <p class="text-4xl font-bold text-[#3F3F3F]">{data.aboutUs.title}</p>
        <p class="w-full lg:w-[80%] text-base leading-7 text-[#878787]">
          {data.aboutUs.content}
        </p>
      </div>
      {#if data.aboutUs.benefits}
        <div class="max-w-[400px]">
          {#each data.aboutUs.benefits.list as item, index}
            <div
              class="benefit-card max-w-[200px] p-4 font-semibold mb-9 border-b-4 border-[#CE02CE] bg-white rounded-b-lg shadow-lg"
              class:left={index % 2 === 0}
              class:right={index % 2 !== 0}
            >
              {item.title}
            </div>
          {/each}
        </div>
      {:else}
        <img src={data.aboutUs.imageUrl} alt="Our Story" class="rounded-2xl max-h-[450px]" />
      {/if}
    </section>
  </section>
{/if}

<style>
  .benefit-card {
    transition: transform 0.3s ease-in-out;
    position: relative;
  }
  .benefit-card.left {
    float: left;
    margin-left: 6%;
    z-index: 2;
  }
  .benefit-card.right {
    float: right;
    margin-right: 6%;
    z-index: 1;
  }
  /* Make sure the cards overlap slightly */
  .benefit-card:not(:first-child) {
    margin-top: -40px; /* Adjust this for more overlap */
  }
</style>
