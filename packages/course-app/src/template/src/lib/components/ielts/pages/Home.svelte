<script>
  import { getPageSection } from '@/utils/helpers/page';
  import { homePage } from '@/utils/stores/pages';
  import { courses } from '$lib/utils/stores/course';
  import { quintIn, quintInOut, quintOut } from 'svelte/easing';
  import { fade, fly, slide } from 'svelte/transition';
  import { CheckmarkFilled } from 'carbon-icons-svelte';
  import defaultBanner from '../assets/org-banner.png';
  import defaultAvatar from '../assets/ielts-user.png';

  import PrimaryButton from '../PrimaryButton.svelte';
  import { goto } from '$app/navigation';
  import CourseCard from '../CourseCard.svelte';
  import EmptyState from '../EmptyState.svelte';
  import Accordion from '../Accordion.svelte';

  const coursesSection = $derived(getPageSection($homePage, 'courses'));
  const aboutSection = $derived(getPageSection($homePage, 'about'));
  const faqSection = $derived(getPageSection($homePage, 'faq'));
  const testimonialSection = $derived(getPageSection($homePage, 'testimonial'));
  const footerNoteSection = $derived(getPageSection($homePage, 'cta'));

  let currentIndex = $state(0);
  let viewAll = $state(false);

  /**
   * @param {number} index
   */

  function goToSlide(index) {
    currentIndex = index;
  }

  // function nextSlide() {
  //   currentIndex = (currentIndex + 1) % testimonialSection?.settings.list.length;
  // }
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
              class="font-playfair text-2xl font-semibold text-[#3D3D3D] first-line:w-full xl:w-[80%] xl:text-5xl"
            >
              {content.settings.title}
            </p>
            <p class="font-inter w-full text-[#656565] lg:w-[70%] xl:text-lg">
              {content.settings.subtitle}
            </p>
            <PrimaryButton
              class="rounded-none font-serif font-semibold uppercase "
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
                : defaultBanner}
              class="mt-2 h-full max-h-[550px] w-full max-w-[800px] rounded-md object-cover md:mt-0"
            />
          </div>
        </section>
      </section>
    {/if}
  {/if}
  <!-- testimonial -->
  {#if testimonialSection?.show}
    <section class="overflow-x-hidden px-4 py-6">
      <div
        class="bg-ielts relative mx-auto flex h-[220px] w-full items-center text-center text-white md:w-[80%] lg:w-[70%]"
      >
        <!-- Pointer at the top -->
        <div
          class="bg-ielts absolute left-[50px] top-[-25px] h-10 w-16 -translate-x-1/2 transform"
          style="clip-path: polygon(50% 0%, 0% 100%, 100% 100%);"
        ></div>

        <!-- Testimonial content with fly transition (from right) -->
        <div
          class="mx-auto flex h-full w-full flex-row overflow-x-hidden p-4 md:w-[90%] lg:w-[80%]"
        >
          {#each testimonialSection.settings.list as testimonial, index}
            {#if currentIndex === index}
              <div
                transition:slide={{ duration: 300, easing: quintOut, axis: 'x' }}
                class="flex min-w-full flex-1 flex-col items-center justify-between md:h-full"
              >
                <p
                  class=" font-playfair line-clamp-4 text-base font-semibold italic md:line-clamp-3 md:text-lg"
                >
                  "{testimonial.description}"
                </p>

                <div class="flex items-center justify-center">
                  <img
                    src={testimonial.image ? testimonial.image : defaultAvatar}
                    alt="profile"
                    class="mr-4 h-14 w-14 rounded-full object-cover"
                  />
                  <div class="font-inter text-start">
                    <strong>{testimonial.name}</strong><br />
                    <span class="text-sm uppercase text-gray-300">{testimonial.role}</span>
                  </div>
                </div>
              </div>
            {/if}
          {/each}
        </div>
      </div>

      <!-- Dots for testimonial navigation -->
      <div class="mt-4 flex justify-center space-x-2">
        {#each testimonialSection.settings.list as _, index}
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
  {/if}

  <!-- courses -->
  {#if coursesSection?.show}
    <section id="course" class="h-full bg-white px-4 pb-20 pt-4 md:px-20">
      <h1 class="text-center font-serif text-3xl">{coursesSection.settings.title}</h1>
      <p class="font-inter mx-auto mb-8 w-full text-center font-medium md:w-[50%]">
        {coursesSection.settings.subtitle}
      </p>

      {#if $courses.length > 0}
        <section class="mx-auto flex w-fit flex-wrap items-center justify-center gap-5 p-4">
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
              class="rounded-none text-lg font-semibold text-white"
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

  <!-- about -->
  {#if aboutSection?.show}
    <section id="course" class="h-full bg-white px-4 pb-20 pt-4 md:px-10">
      <h1 class="mx-auto w-full text-center font-serif text-3xl text-[#282828] md:w-[50%]">
        {aboutSection.settings.title}
      </h1>
      <p class="text-inter mx-auto mb-8 w-[60%] text-center font-medium text-[#656565]">
        {aboutSection.settings.subtitle}
      </p>

      <section class="flex flex-wrap items-center justify-center gap-8 p-4">
        {#each aboutSection.settings.benefits.list as item}
          <div
            class="flex h-[150px] max-h-[300px] max-w-[300px] flex-col justify-start gap-4 rounded-lg border-2 border-[#EAEAEA] bg-[#FDFDFD] p-4 md:max-h-[200px] md:max-w-[500px]"
          >
            <span class="flex items-center gap-2">
              <CheckmarkFilled size={24} class="fill-[#0F62FE]" />
              <p class="font-serif text-xl">{item.title}</p>
            </span>
            <p class="font-inter text-base text-[#878787]">{item.subtitle}</p>
          </div>
        {/each}
      </section>
    </section>
  {/if}

  <!-- learningpath -->
  <!-- <LearningPath /> -->

  <!-- faq -->
  {#if faqSection?.show}
    <section class="h-full space-y-5 bg-[#F9F9F9] px-4 pb-20 pt-8">
      <h1 class="text-center font-serif text-3xl text-[#3F3F3F]">{faqSection.settings.title}</h1>
      <section class="mx-auto w-full space-y-10 p-4 md:w-[80%]">
        {#each faqSection.settings.questions as faq}
          <Accordion title={faq.title} content={faq.content} />
        {/each}
      </section>
    </section>
  {/if}

  <!-- footernote -->
  {#if footerNoteSection?.show}
    <section
      class="flex flex-col items-center justify-between space-y-4 bg-blue-800 px-6 py-20 lg:px-10"
    >
      <div class="flex w-full items-center justify-center">
        <p
          class="w-full text-center font-serif text-4xl font-bold capitalize text-white lg:w-[70%]"
        >
          {footerNoteSection.settings.title}
        </p>
      </div>
      <p class="w-full text-center text-white lg:w-[50%]">
        {footerNoteSection.settings.subtitle}
      </p>
      <div class="my-5 flex w-full items-center justify-center">
        <PrimaryButton
          label={footerNoteSection.settings.buttonLabel}
          class="rounded-none bg-white text-lg font-bold uppercase text-blue-700 hover:bg-white"
        />
      </div>
    </section>
  {/if}
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
