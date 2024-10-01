<script>
  import { landingPageSettings } from '$lib/components/Org/Settings/store';

  let benefits = [
    {
      title: 'Experienced tutor',
      desc: ' Lorem ipsum dolor sit amet consectetur adipisicing elit. Minus ab obcaecati neque adipisci harum ducimus dolores hic impedit beatae vitae! Lorem ipsum dolor sit, amet consectetur adipisicing elit. Voluptate vel rerum consectetur magni blanditiis hic ab natus autem nulla ipsa.'
    },
    {
      title: 'Hands-on Projects',
      desc: ' Lorem ipsum dolor sit amet consectetur adipisicing elit. Minus ab obcaecati neque adipisci harum ducimus dolores hic impedit beatae vitae! Lorem ipsum dolor sit, amet consectetur adipisicing elit. Voluptate vel rerum consectetur magni blanditiis hic ab natus autem nulla ipsa.'
    },
    {
      title: 'Live Sessions',
      desc: '  Voluptate vel rerum consectetur magni blanditiis hic ab natus autem nulla ipsa.'
    },
    {
      title: 'Interactive Lessons',
      desc: ' Lorem ipsum dolor sit amet consectetur adipisicing elit. Minus ab obcaecati neque adipisci harum ducimus dolores hic impedit beatae vitae! Lorem ipsum dolor sit, amet consectetur adipisicing elit. Voluptate vel rerum consectetur magni blanditiis hic ab natus autem nulla ipsa.'
    },
    {
      title: 'Answer Hints',
      desc: ' Lorem ipsum dolor sit amet consectetur adipisicing elit. Minus ab obcaecati neque adipisci harum ducimus dolores hic impedit beatae vitae! Lorem ipsum dolor sit, amet consectetur adipisicing elit. Voluptate vel rerum consectetur magni blanditiis hic ab natus autem nulla ipsa.'
    },
    {
      title: 'Professional certificates',
      desc: ' Lorem ipsum dolor sit amet consectetur adipisicing elit. Minus ab obcaecati neque adipisci harum ducimus dolores hic impedit beatae vitae! Lorem ipsum dolor sit, amet consectetur adipisicing elit. Voluptate vel rerum consectetur magni blanditiis hic ab natus autem nulla ipsa.'
    }
  ];
</script>

{#if $landingPageSettings.aboutUs.show}
  <section id="aboutus" class="relative w-full bg-white py-10 px-4 lg:px-14">
    <div class="mx-4 flex items-center md:items-start gap-4 justify-between flex-col md:flex-row">
      <div class="w-full md:w-[60%] lg:w-[50%] mr-5 mb-5 lg:mb-0">
        <p class="font-normal font-slab text-2xl md:text-3xl lg:text-4xl w-full md:w-[90%] mb-8">
          {$landingPageSettings.aboutUs.title}
        </p>
        <div class="space-y-3">
          {#each benefits as items}
            <div
              class="p-3 bg-[#FDFDFD] border border-[#EAEAEA] rounded-sm h-[12rem] overflow-hidden"
            >
              <p class="mb-2 text-xl md:text-2xl w-[90%] font-slab line-clamp-2">{items.title}</p>
              <p
                class="text-[#878787] font-roboto w-[90%] mb-4 line-clamp-5 lg:line-clamp-4 text-sm lg:text-xl"
              >
                {items.desc}
              </p>
            </div>
          {/each}
        </div>
      </div>

      <div class="image sticky top-0 hidden md:block">
        <img
          src={$landingPageSettings.aboutUs.imageUrl}
          alt="Our Story"
          class="h-[450px] w-[450px] object-cover"
        />
      </div>
    </div>
  </section>
{/if}
