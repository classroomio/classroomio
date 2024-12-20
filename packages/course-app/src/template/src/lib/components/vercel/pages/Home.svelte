<script lang="ts">
  import { goto } from '$app/navigation';
  import { getPageSection } from '@/utils/helpers/page';
  import { homePage } from '@/utils/stores/pages';
  import { onMount } from 'svelte';
  import EmptyState from '../EmptyState.svelte';

  import AddLarge from 'carbon-icons-svelte/lib/AddLarge.svelte';
  import CourseCard from '../CourseCard.svelte';
  import { courses } from '@/utils/stores/course';
  import PrimaryButton from '../PrimaryButton.svelte';
  import { SECTION } from '@/utils/constants/page';
  import HeroContainer from '../HeroContainer.svelte';
  import banner from '../assets/org-banner.png';
  import { ArrowLeft, ArrowRight, CheckmarkFilled, ArrowUp, ArrowDown } from 'carbon-icons-svelte';
  import AboutContainer from '../AboutContainer.svelte';
  import FaqContainer from '../FaqContainer.svelte';
  import TestimonialCard from '../TestimonialCard.svelte';

  const heroSection = $derived(getPageSection($homePage, SECTION.HERO));
  const aboutSection = $derived(getPageSection($homePage, SECTION.ABOUT));
  const courseSection = $derived(getPageSection($homePage, SECTION.COURSE));
  const faqSection = $derived(getPageSection($homePage, SECTION.FAQ));
  const testimonialSection = $derived(getPageSection($homePage, SECTION.TESTIMONIAL));
  const ctaSection = $derived(getPageSection($homePage, SECTION.CTA));

  let scrollPosition = $state(0);

  let scrollContainer: HTMLElement | undefined = $state();
  let faqContainer: HTMLElement | undefined = $state();

  /**
   * Functions
   */
  function scrollLeft() {
    scrollContainer?.scrollBy({ left: -scrollContainer.clientWidth, behavior: 'smooth' });
  }

  function scrollRight() {
    scrollContainer?.scrollBy({ left: scrollContainer.clientWidth, behavior: 'smooth' });
  }

  function scrollUp() {
    faqContainer?.scrollBy({ top: -300, behavior: 'smooth' });
  }

  function scrollDown() {
    faqContainer?.scrollBy({ top: 300, behavior: 'smooth' });
  }

  let letters = $derived(heroSection?.settings.title.split(''));
  let subtitleLetters = $derived(heroSection?.settings.subtitle.split(''));

  const subtitleFadeOffset = $derived(letters.length * 3);

  onMount(() => {
    const handleScroll = () => {
      scrollPosition = window.scrollY;
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  });
</script>

<section class="overflow-hidden bg-black py-10 text-white">
  <div class="px-2 md:px-20 lg:gap-4">
    <div
      class="mx-auto w-full divide-y divide-zinc-400/20 border-[0.2px] border-zinc-400/20 md:max-w-[90vw] lg:max-w-[70vw]"
    >
      {#if heroSection?.show}
        <section class="relative flex min-h-[50vh] items-center justify-center pb-10">
          <div class="divide-y divide-zinc-400/20">
            <AddLarge class="absolute -left-4 -top-4 z-20 text-white" size={32} />
            <AddLarge class="absolute -bottom-4 -right-4 z-20 text-white" size={32} />
            <div
              class="relative w-full items-center justify-center gap-5 text-center md:max-w-[90vw] md:flex-col lg:max-w-[70vw]"
            >
              <!-- horizontal lines -->
              <span>
                <div
                  class="absolute left-0 top-[30%] -z-0 hidden h-[0.2px] w-full bg-zinc-400/20 md:block"
                ></div>
                <div
                  class="absolute left-0 top-[50%] -z-0 hidden h-[0.2px] w-full bg-zinc-400/20 md:block"
                ></div>
                <div
                  class="absolute left-0 top-[70%] -z-0 hidden h-[0.2px] w-full bg-zinc-400/20 md:block"
                ></div>
              </span>

              <HeroContainer>
                <div class=" mb-4 w-full space-y-6 py-20">
                  <p class="mx-auto w-full text-3xl font-bold md:w-[90%] md:text-4xl">
                    {#each letters as letter, index}
                      <span>
                        {letter}
                      </span>
                    {/each}
                  </p>
                  <p class="mx-auto w-full md:w-[70%]">
                    {#each subtitleLetters as letter, index}
                      <span
                        style="opacity: {Math.max(
                          0,
                          1 - (scrollPosition - (index * 10 + subtitleFadeOffset)) / 150
                        )}"
                        class="transition-opacity duration-300"
                      >
                        {letter}
                      </span>
                    {/each}
                  </p>
                  <div class="flex flex-col items-center justify-center gap-4 md:flex-row">
                    <PrimaryButton
                      href={heroSection?.settings.action.link}
                      label="Start learning"
                      class="rounded-full px-10"
                    />
                    <PrimaryButton
                      label="More about us"
                      href="/#about"
                      class="border-vercel-border rounded-full border bg-transparent px-10"
                    />
                  </div>
                  <div class="mx-auto flex w-full items-center justify-center">
                    <img
                      src={banner}
                      alt=""
                      class="size-20 relative left-8 top-0 z-20 rounded-full object-cover"
                    />
                    <img
                      src={banner}
                      alt=""
                      class="size-20 relative z-10 rounded-full object-cover"
                    />
                    <img
                      src={banner}
                      alt=""
                      class="size-20 relative -left-8 rounded-full object-cover"
                    />
                  </div>
                </div>
              </HeroContainer>
            </div>

            <!-- testimonial section -->
            <div class="w-full">
              {#if testimonialSection?.show}
                <div
                  class="mx-auto flex w-full flex-col items-center justify-center p-2 md:max-w-[90%]"
                >
                  <div class="flex w-full items-center justify-center overflow-x-hidden">
                    <section
                      bind:this={scrollContainer}
                      class="scrollbar-hide flex w-full min-w-full snap-x items-center justify-center overflow-x-auto py-4"
                    >
                      <!-- this is container -->
                      {#each testimonialSection.settings.list as testimonial, i}
                        <TestimonialCard
                          name={testimonial.name}
                          {banner}
                          description={testimonial.description}
                          role={testimonial.role}
                        />
                      {/each}
                    </section>
                  </div>
                  <div class="hidden w-full items-center justify-end gap-2 md:flex">
                    <button
                      class="border-vercel-border flex w-fit items-center justify-center rounded-full border bg-transparent p-2 hover:bg-gray-500 hover:text-black"
                      onclick={scrollLeft}
                    >
                      <ArrowLeft />
                    </button>
                    <button
                      class="border-vercel-border flex w-fit items-center justify-center rounded-full border bg-transparent p-2 hover:bg-gray-500 hover:text-black"
                      onclick={scrollRight}
                    >
                      <ArrowRight />
                    </button>
                  </div>
                </div>
              {/if}
            </div>
          </div>
        </section>
      {/if}

      <!-- courses -->
      <div class="w-full">
        {#if courseSection?.show}
          <section id="course" class="flex h-full flex-col divide-x divide-zinc-400/20 md:flex-row">
            <div class="w-full p-6 text-center md:w-[40%] md:text-start">
              <h1 class="mb-2 text-xl font-bold">
                {courseSection.settings.title}
              </h1>
              <p class="mb-6 text-sm text-gray-400">
                {courseSection.settings.subtitle}
              </p>
              <PrimaryButton
                onClick={() => {
                  goto('/courses');
                }}
                class="group w-full gap-6 rounded-full text-white"
                label="View all courses"
              />
            </div>
            {#if $courses.length > 0}
              <section
                class="grid w-full grid-cols-1 place-items-center gap-1 px-4 py-6 lg:grid-cols-2"
              >
                {#each $courses.slice(0, 2) as courseData}
                  <CourseCard
                    slug={courseData.slug}
                    title={courseData.title}
                    bannerImage={courseData.banner}
                    cost={courseData.cost}
                    description={courseData.description}
                    lessons={courseData.lessonsCount}
                    course={$courses.length}
                  />
                {/each}
              </section>
            {:else}
              <div class="mx-auto w-full p-2">
                <EmptyState />
              </div>
            {/if}
          </section>
        {/if}
      </div>

      <!-- about -->

      {#if aboutSection?.show}
        <section id="about">
          <AboutContainer>
            <div class="divide-y divide-zinc-400/20">
              <div class="px-8 py-14 text-center">
                <p class="mx-auto mb-4 w-[70%] text-xl font-semibold">
                  {aboutSection.settings.title}
                </p>
                <p class="mx-auto w-[70%] text-sm">{aboutSection.settings.subtitle}</p>
              </div>
              <div class="grid grid-cols-1 divide-x divide-y divide-zinc-400/20 md:grid-cols-2">
                {#each aboutSection.settings.benefits.list as benefit}
                  <div class="px-4 py-6">
                    <span class=" mb-2 flex items-center gap-2">
                      <CheckmarkFilled class="fill-vercel" size={20} />
                      <p class="text-xl font-semibold">{benefit.title}</p>
                    </span>
                    <p>{benefit.subtitle}</p>
                  </div>
                {/each}
              </div>
            </div>
          </AboutContainer>
        </section>
      {/if}
    </div>
    <!-- faq -->
    {#if faqSection?.show}
      <section
        id="faq"
        class="mx-auto my-4 h-full w-full border border-zinc-400/20 md:max-w-[90vw] lg:max-w-[70vw]"
      >
        <!-- svelte-ignore slot_element_deprecated -->
        <FaqContainer>
          <div class="flex flex-col items-start divide-x divide-zinc-400/20 md:flex-row">
            <div class="w-full border-b border-zinc-400/20 px-4 py-8 text-center md:text-start">
              <p class="text-lg font-semibold">{faqSection.settings.title}</p>
            </div>

            <div class="h-[70vh] overflow-y-hidden p-4 lg:h-[100vh]">
              <div bind:this={faqContainer} class="scrollbar-hide h-full w-full overflow-y-auto">
                {#each faqSection.settings.questions as faq}
                  <div
                    class="border-vercel-border mb-2 space-y-4 rounded-lg border bg-zinc-600/20 p-6"
                  >
                    <p class="font-semibold">{faq.title}</p>

                    <p>{faq.content}</p>
                  </div>
                {/each}
              </div>
            </div>
          </div>
          <div slot="buttons">
            <div class="hidden w-full flex-col items-center justify-end gap-2 md:flex">
              <button
                class="border-vercel-border flex w-fit items-center justify-center rounded-full border bg-transparent p-2 hover:bg-gray-500 hover:text-black"
                onclick={scrollUp}
              >
                <ArrowUp />
              </button>
              <button
                class="border-vercel-border flex w-fit items-center justify-center rounded-full border bg-transparent p-2 hover:bg-gray-500 hover:text-black"
                onclick={scrollDown}
              >
                <ArrowDown />
              </button>
            </div>
          </div>
        </FaqContainer>
      </section>
    {/if}

    <!-- footerNote -->
    {#if ctaSection?.show}
      <section
        class="border-vercel-border mx-auto my-8 flex w-full flex-col items-center justify-between gap-4 rounded-md bg-zinc-500/20 px-4 py-16 md:max-w-[90vw] md:flex-row md:px-8 lg:max-w-[70vw]"
      >
        <div class="space-y-4 text-center md:text-start">
          <p class="text-4xl font-semibold">
            {ctaSection.settings.title}
          </p>
          <p class="text-sm md:w-[80%]">{ctaSection.settings.subtitle}</p>
        </div>
        <PrimaryButton
          label={ctaSection.settings.button.label}
          href={ctaSection.settings.button.link}
          class="rounded-full px-6"
        />
      </section>
    {/if}
  </div>
</section>

<style>
  /* Hide scrollbar for Webkit browsers */
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }

  /* Hide scrollbar for other browsers */
  .scrollbar-hide {
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }
</style>
