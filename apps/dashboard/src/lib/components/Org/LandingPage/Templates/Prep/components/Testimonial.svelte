<script>
  import { fly } from 'svelte/transition';

  // Example testimonial data
  let testimonials = [
    {
      text: "I can't recommend the Mobile App Development bootcamp enough. The course was challenging, but the support from my peers and instructors was incredible. I learned so much about both iOS and Android development, and I'm now developing apps for a tech startup.",
      name: 'Ismail Bolarinwa',
      role: 'STUDENT',
      image: '/org-banner.png' // Use an actual path for profile image
    },
    {
      text: "The course was challenging, but the support from my peers and instructors was incredible. I learned so much about both iOS and Android development, and I'm now developing apps for a tech startup.",
      name: 'Ade Bolanle',
      role: 'TEACHER',
      image: '/org-banner.png' // Use an actual path for profile image
    }
    // {
    //   text: "Mobile App Development bootcamp enough. The course was challenging, but the support from my peers and instructors was incredible. I learned so much about both iOS and Android development, and I'm now developing apps for a tech startup.",
    //   name: 'Ade Babanle',
    //   role: 'STUDENT',
    //   image: '/org-banner.png' // Use an actual path for profile image
    // }
  ];

  let currentIndex = 0;

  // Change the current testimonial
  function goToSlide(index) {
    currentIndex = index;
  }

  function nextSlide() {
    currentIndex = (currentIndex + 1) % testimonials.length;
  }

  // Auto-slide every 5 seconds
  setInterval(nextSlide, 5000);
</script>

<section class="my-4">
  <div
    class="relative h-[200px] w-[70%] mx-auto space-y-4 bg-blue-600 p-4 text-white text-center border border-red-500"
  >
    <!-- Pointer at the top -->
    <div
      class="absolute top-[-25px] left-[5%] transform -translate-x-1/2 w-16 h-10 bg-blue-600"
      style="clip-path: polygon(50% 0%, 0% 100%, 100% 100%);"
    ></div>

    <!-- Testimonial content with fly transition (from right) -->
    {#each testimonials as testimonial, index}
      {#if currentIndex === index}
        <div transition:fly={{ x: 200 }}>
          <p class="italic text-lg mb-4">
            "{testimonial.text}"
          </p>

          <div class="flex items-center justify-center mt-4">
            <img src={testimonial.image} alt="profile" class="rounded-full w-12 h-12 mr-4" />
            <div>
              <strong>{testimonial.name}</strong><br />
              <span class="text-sm text-gray-300">{testimonial.role}</span>
            </div>
          </div>
        </div>
      {/if}
    {/each}
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
