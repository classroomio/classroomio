<script>
  import { landingPageSettings } from '$lib/components/Org/Settings/store';

  let benefits = [
    {
      title: 'Experienced tutor',
      desc: ' Lorem ipsum dolor sit, amet consectetur adipisicing elit. Voluptate vel rerum consectetur magni blanditiis hic ab natus autem nulla ipsa.'
    },
    {
      title: 'Hands-on Projects',
      desc: ' Lorem ipsum dolor sit, amet consectetur adipisicing elit. Voluptate vel rerum consectetur magni blanditiis hic ab natus autem nulla ipsa.'
    },
    {
      title: 'Live Sessions',
      desc: ' Lorem ipsum dolor sit, amet consectetur adipisicing elit. Voluptate vel rerum consectetur magni blanditiis hic ab natus autem nulla ipsa.'
    }
  ];
</script>

{#if $landingPageSettings.aboutUs.show}
  <section id="aboutus" class="m-h-[400px] my-10 mx-auto max-w-6xl w-full bg-white p-8">
    <div class="mx-4 flex items-start justify-between flex-col lg:flex-row border border-green-500">
      <div class="w-[60%] lg:w-4/5 mr-5 mb-5 lg:mb-0 border border-red-500">
        <p class="font-normal text-2xl md:text-3xl lg:text-4xl w-[90%] mb-8">
          {$landingPageSettings.aboutUs.title}
        </p>

        <div>
          {#each benefits as items}
            <p class="mb-2 text-xl w-[90%]">{items.title}</p>
            <p class="text-[#878787] w-[90%] mb-4">{items.desc}</p>
          {/each}
        </div>
      </div>

      <div class="image">
        <img src={$landingPageSettings.aboutUs.imageUrl} alt="Our Story" class="max-h-[450px]" />
      </div>
    </div>
  </section>
{/if}
