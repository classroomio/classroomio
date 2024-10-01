<script>
  import { quintIn, quintInOut, quintOut } from 'svelte/easing';
  import { fade, fly, slide } from 'svelte/transition';

  // Example testimonial data
  let testimonials = [
    {
      text: "I can't recommend the Mobile App Development bootcamp enough. The course was challenging, but the support from my peers and instructors was incredible. I learned so much about both iOS and Android development, and I'm now developing apps for a tech startup.",
      name: 'Ismail Bolarinwa',
      role: 'STUDENT',
      image: '/org-banner.png'
    },
    {
      text: "The course was challenging, but the support from my peers and instructors was incredible. I learned so much about both iOS and Android development, and I'm now developing apps for a tech startup.",
      name: 'Ade Bolanle',
      role: 'TEACHER',
      image: '/org-banner.png'
    }
  ];

  let currentIndex = 0;

  function goToSlide(index) {
    currentIndex = index;
  }

  function nextSlide() {
    currentIndex = (currentIndex + 1) % testimonials.length;
  }

  // Auto-slide every 5 seconds
  // setInterval(nextSlide, 5000);
</script>

<section class="py-6 px-4 overflow-x-hidden">
  <div
    class="flex items-center relative h-[220px] w-full md:w-[80%] lg:w-[70%] mx-auto bg-[#0233BD] text-white text-center"
  >
    <!-- Pointer at the top -->
    <div
      class="absolute top-[-25px] left-[50px] transform -translate-x-1/2 w-16 h-10 bg-[#0233BD]"
      style="clip-path: polygon(50% 0%, 0% 100%, 100% 100%);"
    ></div>

    <!-- Testimonial content with fly transition (from right) -->
    <div class="flex flex-row w-full md:w-[90%] lg:w-[80%] h-full overflow-x-hidden mx-auto p-4">
      {#each testimonials as testimonial, index}
        {#if currentIndex === index}
          <div
            transition:slide={{ duration: 300, easing: quintOut, axis: 'x' }}
            class="flex flex-col items-center justify-between flex-1 min-w-full md:h-full"
          >
            <p
              class=" italic font-playfair font-semibold text-base md:text-lg line-clamp-4 md:line-clamp-3"
            >
              "{testimonial.text}"
            </p>

            <div class="flex items-center justify-center">
              <img src={testimonial.image} alt="profile" class="rounded-full w-14 h-14 mr-4" />
              <div class="font-inter text-start">
                <strong>{testimonial.name}</strong><br />
                <span class="text-sm text-gray-300">{testimonial.role}</span>
              </div>
            </div>
          </div>
        {/if}
      {/each}
    </div>
  </div>

  <!-- Dots for testimonial navigation -->
  <div class="flex justify-center space-x-2 mt-4">
    {#each testimonials as _, index}
      <div
        class="w-3 h-3 rounded-full cursor-pointer transition-opacity duration-300 {currentIndex ===
        index
          ? 'bg-blue-900'
          : 'bg-blue-900 opacity-50'}"
        on:click={() => goToSlide(index)}
      ></div>
    {/each}
  </div>
</section>

<style>
  /* Optional smooth transition effect for text */
  :global(.testimonial-text-enter-active, .testimonial-text-leave-active) {
    transition: opacity 0.5s;
  }
  :global(.testimonial-text-enter, .testimonial-text-leave-to) {
    opacity: 0;
  }
</style>
