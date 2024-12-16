<script>
  import { getPageSection } from '@/utils/helpers/page';
  import { homePage } from '@/utils/stores/pages';
  import { courses } from '$lib/utils/stores/course';
  import { quintIn, quintInOut, quintOut } from 'svelte/easing';
  import { fade, fly, slide } from 'svelte/transition';

  import PrimaryButton from '../PrimaryButton.svelte';

  const coursesSection = $derived(getPageSection($homePage, 'courses'));
  const aboutSection = $derived(getPageSection($homePage, 'about'));
  const faqSection = $derived(getPageSection($homePage, 'faq'));
  const testimonialSection = $derived(getPageSection($homePage, 'testimonial'));
  const footerNoteSection = $derived(getPageSection($homePage, 'cta'));

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

  let currentIndex = $state(0);
  let viewAll = false;

  function goToSlide(index) {
    currentIndex = index;
  }

  function nextSlide() {
    currentIndex = (currentIndex + 1) % testimonials.length;
  }
</script>

<main>
  <!-- hero -->
  {#if $homePage}
    {@const content = getPageSection($homePage, 'header')}
    {#if content?.show}
      <section class="flex h-full items-start justify-center px-10 pb-20 pt-4 lg:px-20 lg:pt-20">
        <section
          class="flex flex-col-reverse items-start gap-5 md:flex-row md:items-center md:justify-between"
        >
          <div class="w-full space-y-6">
            <p
              class="font-playfair text-2xl font-semibold text-[#3D3D3D] first-line:w-full xl:w-[60%] xl:text-5xl"
            >
              {content.settings.title}
            </p>
            <p class="font-inter w-full text-[#656565] lg:w-[70%] xl:text-lg">
              {content.settings.subtitle}
            </p>
            <PrimaryButton
              className="!bg-[#0233BD] rounded-none uppercase text-white font-semibold font-playfair"
              label={content.settings.action.label}
              onClick={() => {
                content.settings.action.redirect && goto(content.settings.action.link);
              }}
            />
          </div>

          <div
            class="flex max-h-full w-full rounded-md shadow-[-12px_12px_0px_#0233BD] md:h-[400px] md:w-1/2 md:max-w-[800px]"
          >
            <img
              style="min-width:280px; min-height:200px"
              alt="landing page banner"
              src={content.settings?.banner?.image
                ? content.settings?.banner?.image
                : '/org-banner.png'}
              class="mt-2 h-full max-h-[550px] w-full max-w-[800px] rounded-md object-cover md:mt-0"
            />
          </div>
        </section>
      </section>
    {/if}
  {/if}
  <!-- testimonial -->
  <section class="overflow-x-hidden px-4 py-6">
    <div
      class="relative mx-auto flex h-[220px] w-full items-center bg-[#0233BD] text-center text-white md:w-[80%] lg:w-[70%]"
    >
      <!-- Pointer at the top -->
      <div
        class="absolute left-[50px] top-[-25px] h-10 w-16 -translate-x-1/2 transform bg-[#0233BD]"
        style="clip-path: polygon(50% 0%, 0% 100%, 100% 100%);"
      ></div>

      <!-- Testimonial content with fly transition (from right) -->
      <div class="mx-auto flex h-full w-full flex-row overflow-x-hidden p-4 md:w-[90%] lg:w-[80%]">
        {#each testimonials as testimonial, index}
          {#if currentIndex === index}
            <div
              transition:slide={{ duration: 300, easing: quintOut, axis: 'x' }}
              class="flex min-w-full flex-1 flex-col items-center justify-between md:h-full"
            >
              <p
                class=" font-playfair line-clamp-4 text-base font-semibold italic md:line-clamp-3 md:text-lg"
              >
                "{testimonial.text}"
              </p>

              <div class="flex items-center justify-center">
                <img src={testimonial.image} alt="profile" class="mr-4 h-14 w-14 rounded-full" />
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
    <div class="mt-4 flex justify-center space-x-2">
      {#each testimonials as _, index}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <!-- svelte-ignore event_directive_deprecated -->
        <div
          class="h-3 w-3 cursor-pointer rounded-full transition-opacity duration-300 {currentIndex ===
          index
            ? 'bg-blue-900'
            : 'bg-blue-900 opacity-50'}"
          on:click={() => goToSlide(index)}
        ></div>
      {/each}
    </div>
  </section>

  <!-- courses -->
  {#if coursesSection?.show}
    <section id="course" class="h-full bg-white px-4 pb-20 pt-4 md:px-20">
      <h1 class="font-playfair text-center text-3xl">{coursesSection.settings.title}</h1>
      <p class="font-inter mx-auto mb-8 w-full text-center font-medium md:w-[50%]">
        {coursesSection.settings.subtitle}
      </p>

      {#if $courses.length > 0}
        <section class="flex flex-wrap items-center justify-center gap-4 p-4 md:justify-start">
          {#each $courses.slice(0, viewAll ? $courses.length : 3) as courseData}
            <CourseCard
              slug={courseData.slug}
              title={courseData.title}
              description={courseData.description}
            />
          {/each}
        </section>
        {#if $courses.length > 3}
          <div class="my-5 flex w-full items-center justify-center">
            <PrimaryButton
              label="VIEW MORE PREPCOURSES"
              variant={VARIANTS.NONE}
              className="rounded-none text-lg !bg-[#0233BD] text-white font-semibold"
              onClick={() => (viewAll = !viewAll)}
            />
          </div>
        {/if}
      {:else}
        <div class="px-10">
          <EmptyState />
        </div>
      {/if}
    </section>
  {/if}

  <Courses />
  <AboutUs />
  <LearningPath />
  <FAQ />
  <FooterNote />
</main>

<style>
  /* Optional smooth transition effect for text */
  :global(.testimonial-text-enter-active, .testimonial-text-leave-active) {
    transition: opacity 0.5s;
  }
  :global(.testimonial-text-enter, .testimonial-text-leave-to) {
    opacity: 0;
  }
</style>
