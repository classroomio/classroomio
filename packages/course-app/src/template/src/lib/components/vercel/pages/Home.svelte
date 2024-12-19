<script lang="ts">
  import { goto } from '$app/navigation';
  import { getPageSection } from '@/utils/helpers/page';
  import { homePage } from '@/utils/stores/pages';
  import DirectionStraightRight from 'carbon-icons-svelte/lib/DirectionStraightRight.svelte';
  import { onMount } from 'svelte';
  import EmptyState from '../EmptyState.svelte';

  import AddLarge from 'carbon-icons-svelte/lib/AddLarge.svelte';

  import CourseCard from '../CourseCard.svelte';
  import { courses } from '@/utils/stores/course';
  import Accordion from '../Accordion.svelte';
  import TestimonialCard from '../TestimonialCard.svelte';
  import PrimaryButton from '../PrimaryButton.svelte';
  import { SECTION } from '@/utils/constants/page';
  import SectionContainer from '../SectionContainer.svelte';
  import banner from '../assets/org-banner.png';
  import { ArrowLeft, ArrowRight } from 'carbon-icons-svelte';

  const heroSection = $derived(getPageSection($homePage, SECTION.HERO));
  const courseSection = $derived(getPageSection($homePage, SECTION.COURSE));
  const faqSection = $derived(getPageSection($homePage, SECTION.FAQ));
  const testimonialSection = $derived(getPageSection($homePage, SECTION.TESTIMONIAL));

  let viewAll = false;

  let scrollPosition = $state(0);

  let testimoniallist = [1, 2, 3, 4, 5, 6, 7];
  let scrollContainer: HTMLElement | undefined = $state();

  /**
   * Functions
   */
  function scrollLeft() {
    scrollContainer?.scrollBy({ left: -scrollContainer.clientWidth, behavior: 'smooth' });
  }

  function scrollRight() {
    scrollContainer?.scrollBy({ left: scrollContainer.clientWidth, behavior: 'smooth' });
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

<section class="bg-black text-white">
  <div class="flex items-start px-6 md:px-20 lg:gap-4">
    <div class="mx-auto max-w-[70vw] divide-y divide-zinc-400/20 border-[0.2px] border-zinc-400/20">
      {#if heroSection?.show}
        <section class="flex min-h-[50vh] items-center justify-center overflow-hidden pb-10">
          <div class="divide-y divide-zinc-400/20">
            <div
              class="relative max-w-[70vw] flex-col-reverse items-center justify-center gap-5 text-center md:flex-col"
            >
              <!-- horizontal lines -->
              <span>
                <div class="absolute left-0 top-[30%] -z-0 h-[0.2px] w-full bg-zinc-400/20"></div>
                <div class="absolute left-0 top-[50%] -z-0 h-[0.2px] w-full bg-zinc-400/20"></div>
                <div class="absolute left-0 top-[70%] -z-0 h-[0.2px] w-full bg-zinc-400/20"></div>
              </span>
              <!-- <AddLarge class="absolute -left-4 -top-4 text-white" size={32} />
              <AddLarge class="absolute -bottom-4 -right-4 text-white" size={32} /> -->
              <SectionContainer>
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
                  <div class="space-x-4">
                    <PrimaryButton
                      href={heroSection?.settings.action.link}
                      label="Start learning"
                      class="rounded-full px-10"
                    />
                    <PrimaryButton
                      label="More about us"
                      class="rounded-full border bg-transparent px-10"
                    />
                  </div>
                  <div class="mx-auto flex w-full items-center justify-center">
                    <img
                      src={banner}
                      alt=""
                      class="size-20 relative left-4 top-0 z-50 rounded-full object-cover"
                    />
                    <img
                      src={banner}
                      alt=""
                      class="size-20 relative z-20 rounded-full object-cover"
                    />
                    <img
                      src={banner}
                      alt=""
                      class="size-20 relative -left-4 z-10 rounded-full object-cover"
                    />
                  </div>
                </div>
              </SectionContainer>
            </div>
            <!-- testimonial section -->
            {#if testimonialSection?.show}
              <div class="flex w-[70vw] flex-col items-center justify-center p-6">
                <div class="flex w-full items-center justify-center overflow-x-hidden">
                  <section
                    bind:this={scrollContainer}
                    class="scrollbar-hide flex w-full items-center gap-4 overflow-x-auto py-4 pr-2"
                  >
                    <!-- this is container -->
                    {#each testimonialSection.settings.list as testimonial, i}
                      <div class="flex w-full min-w-full items-center justify-center gap-4">
                        <div
                          class="flex w-[30%] flex-col items-center justify-center space-y-2 text-center"
                        >
                          <img src={banner} alt="" class="size-10 rounded-full" />
                          <p class="text-bold text-lg">{testimonial.name}</p>
                          <p class="text-sm">{testimonial.role}</p>
                        </div>
                        <div class="w-full">
                          {testimonial.description}
                        </div>
                      </div>
                    {/each}
                  </section>
                </div>
                <div class="hidden w-full items-center justify-end gap-2 md:flex">
                  <button
                    class="flex w-fit items-center justify-center rounded-full border border-white bg-transparent p-2 hover:bg-gray-500 hover:text-black"
                    onclick={scrollLeft}
                  >
                    <ArrowLeft />
                  </button>
                  <button
                    class="flex w-fit items-center justify-center rounded-full border border-white bg-transparent p-2 hover:bg-gray-500 hover:text-black"
                    onclick={scrollRight}
                  >
                    <ArrowRight />
                  </button>
                </div>
              </div>
            {/if}
          </div>
        </section>
      {/if}

      <!-- <div class="fixed lg:sticky top-2 left-[5%] lg:left-[2%] w-[90%] mx-auto lg:w-fit z-50">
            <Navigation />
          </div> -->

      <!-- courses -->
      <div class="w-full">
        {#if courseSection?.show}
          <section id="course" class="flex h-full divide-x divide-zinc-400/20">
            <div class="w-[40%] p-6">
              <h1 class="mb-2 text-start text-xl font-bold">
                {courseSection.settings.title}
              </h1>
              <p class="mb-6 text-start text-sm text-[#878787]">
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
                class="grid w-full grid-cols-1 place-items-center gap-1 px-4 py-6 md:grid-cols-2"
              >
                {#each $courses.slice(0, viewAll ? $courses.length : 3) as courseData}
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
              {#if $courses.length > 3}
                <div class="my-5 flex w-full items-center justify-center px-2">
                  <PrimaryButton
                    onClick={() => {
                      goto('/courses');
                    }}
                    class="group w-full gap-6 rounded-none text-white"
                    label="View all courses"
                  >
                    <DirectionStraightRight
                      class="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </PrimaryButton>
                </div>
              {/if}
            {:else}
              <div class="mx-auto w-full">
                <EmptyState className="dark:bg-[#232429] dark:border-[#EAEAEA]" />
              </div>
            {/if}
          </section>
        {/if}
      </div>
      <!-- faq -->
      {#if faqSection?.show}
        <section id="faq" class="h-full pb-20 pt-4">
          <h1 class="mb-4 text-center text-3xl font-bold">{faqSection.settings.title}</h1>
          <section class="mx-auto w-full space-y-2 py-5">
            {#each faqSection.settings.questions as faq}
              <Accordion title={faq.title} content={faq.content} />
            {/each}
          </section>
        </section>
      {/if}

      <!-- testimonial -->
      {#if testimonialSection?.show}
        <section id="testimonial" class="h-full pb-20 pt-4">
          <h1 class="mb-4 text-start text-3xl font-bold">Testimonial</h1>
          <section class="grid grid-cols-1 place-items-center gap-4 md:grid-cols-2 xl:grid-cols-3">
            {#each testimonialSection.settings.list as item, i}
              <TestimonialCard description={item.description} name={item.name} index={i} />
            {/each}
          </section>
        </section>
      {/if}
    </div>
    <!-- <Footer data={org} /> -->
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
