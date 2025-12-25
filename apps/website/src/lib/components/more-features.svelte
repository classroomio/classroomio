<script lang="ts">
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import { folder, globe, team, transcription } from '$lib/emojis';
  import { tools } from '$lib/utils/constants/tools';

  let selected = $state(0);
  let interval: NodeJS.Timer = $state();

  const moreFeatures = [
    {
      icon: globe,
      title: 'Customizable Landing Page',
      description: 'A minimalistic landing page template out of the box to share your courses with the world',
      image: '/landing-page-builder.webp'
    },
    {
      icon: team,
      title: 'Team management',
      description: 'Extend invitations and manage your teaching institution seamlessly through ClassroomIO.',
      image: '/team-management.png'
    },
    // {
    //   icon: transcription,
    //   title: 'Auto Video Transcription',
    //   description:
    //     'AI automatically transcribes videos, making content searchable for seamless student access.',
    //   image: '/video-transcription.png'
    // },
    {
      icon: folder,
      title: 'Downloadable Lesson PDF',
      description: 'Students can download lessons automatically for offline access.',
      image: '/download-pdf.png'
    }
  ];

  const freeTools = tools.filter((item) => item.showFeature);

  onMount(() => {
    if (window.innerWidth > 768) {
      interval = setInterval(() => {
        selected = moreFeatures[selected + 1] ? selected + 1 : 0;
      }, 3000);
    }
  });
</script>

<!-- More Features -->
<section id="morefeatures" class="bg-gray-50 px-3 py-[10%] lg:px-0">
  <div class="mx-0 lg:mx-[12%]">
    <div class="mx-4 mb-14 w-full lg:mx-0 lg:w-4/5">
      <h2 class="mt-2 text-3xl tracking-tight">There is More...</h2>
      <p class="mt-4 w-[94%] text-lg text-gray-500 lg:w-4/5">
        ClassroomIO is packed with useful features while we try to make it easy to use.
      </p>
    </div>

    <div class="flex flex-col-reverse gap-3 md:gap-10 lg:flex-row" id="image-container">
      <div class="mt-5 flex w-[95%] overflow-auto p-3 lg:mt-0 lg:block lg:w-[45%] lg:overflow-hidden">
        {#each moreFeatures as moreFeature, i}
          <button
            class="rounded-md p-4 {i === selected &&
              'selected'} mb-3 min-w-[75vw] cursor-pointer text-start lg:min-w-[unset]"
            onclick={() => {
              selected = i;
              clearInterval(interval);
            }}
          >
            <div class="flex items-center gap-1">
              <img loading="lazy" width="32" height="32" src={moreFeature.icon} alt="" class="w-8" />
              <p class="text-lg">
                {moreFeature.title}
              </p>
            </div>
            <p class="text-sm">{moreFeature.description}</p>
          </button>
        {/each}
      </div>

      <!-- Video  -->
      <div class="h-full w-full p-3 lg:w-2/3 lg:p-0">
        {#key selected}
          <img
            width="100%"
            height="100%"
            loading="lazy"
            id="image"
            in:fly={{ x: 100, duration: 800 }}
            class="flex w-full flex-col items-center"
            src={moreFeatures[selected].image}
            alt={moreFeatures[selected].title}
          />
        {/key}
      </div>
    </div>
  </div>
</section>

<style>
  #morefeatures .selected {
    background-image: linear-gradient(45deg, rgb(253, 239, 132), rgb(247, 198, 169), rgb(21, 186, 196));
  }
</style>
