<script lang="ts">
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import { folder, globe, team, transcription } from '$lib/emojis';

  let selected = 0;
  let interval = 0;

  const moreFeatures = [
    {
      icon: globe,
      title: 'Customizable Landing Page',
      description:
        'A minimalistic landing page template out of the box to share your courses with the world',
      image: '/landing-page-builder.png',
    },
    {
      icon: team,
      title: 'Team management',
      description:
        'Extend invitations and manage your teaching institution seamlessly through ClassroomIO.',
      image: '/team-management.png',
    },
    {
      icon: transcription,
      title: 'Auto Video Transcription',
      description:
        'AI automatically transcribes videos, making content searchable for seamless student access.',
      image: '/video-transcription.png',
    },
    {
      icon: folder,
      title: 'Downloadable Lesson PDF',
      description:
        'Students can download lessons automatically for offline access.',
      image: '/download-pdf.png',
    },
  ];

  onMount(() => {
    if (window.innerWidth > 768) {
      interval = setInterval(() => {
        selected = moreFeatures[selected + 1] ? selected + 1 : 0;
      }, 3000);
    }
  });
</script>

<!-- More Features -->
<section id="morefeatures" class="py-[10%] px-3 lg:px-0 bg-gray-50">
  <div class="mx-0 lg:mx-[12%]">
    <div class="w-full lg:w-4/5 mx-4 lg:mx-0 mb-14">
      <h2
        class="mt-2 text-3xl font-bold font-display tracking-tight lg:text-4xl"
      >
        There is More...
      </h2>
      <p class="mt-4 text-lg inter text-gray-500 w-[94%] lg:w-4/5">
        ClassroomIO is packed with useful features while we try to make it easy
        to use.
      </p>
    </div>

    <div
      class="flex flex-col-reverse lg:flex-row gap-3 md:gap-10"
      id="image-container"
    >
      <div
        class="w-[95%] p-3 mt-5 overflow-auto lg:overflow-hidden lg:mt-0 lg:w-[45%] flex lg:block"
      >
        {#each moreFeatures as moreFeature, i}
          <button
            class="p-4 rounded-md {i === selected &&
              'selected'} mb-3 text-start min-w-[75vw] lg:min-w-[unset]"
            on:mouseenter={() => {
              selected = i;
              clearInterval(interval);
            }}
          >
            <div class="flex gap-1 items-center">
              <img src={moreFeature.icon} alt="" class="w-8" />
              <h4 class="text-lg font-semibold">
                {moreFeature.title}
              </h4>
            </div>
            <p>{moreFeature.description}</p>
          </button>
        {/each}
      </div>

      <!-- Video  -->
      <div class="h-full w-full p-3 lg:w-2/3 lg:p-0">
        {#key selected}
          <img
            id="image"
            in:fly={{ y: 100, duration: 1000 }}
            class="w-full flex flex-col items-center"
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
    background-image: linear-gradient(
      45deg,
      rgb(253, 239, 132),
      rgb(247, 198, 169),
      rgb(21, 186, 196)
    );
  }
</style>
