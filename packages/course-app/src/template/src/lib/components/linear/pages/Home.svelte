<script lang="ts">
  import { goto } from '$app/navigation';
  import { getPageSection } from '@/utils/helpers/page';
  import { homePage } from '@/utils/stores/pages';
  import DirectionStraightRight from 'carbon-icons-svelte/lib/DirectionStraightRight.svelte';
  import { onMount } from 'svelte';
  import EmptyState from '../EmptyState.svelte';
  import { DotPattern } from '$lib/components/ui/animation/dotpattern';

  import CourseCard from '../CourseCard.svelte';
  import { courses } from '@/utils/stores/course';

  import TestimonialCard from '../TestimonialCard.svelte';
  import PrimaryButton from '../PrimaryButton.svelte';
  import { SECTION } from '@/utils/constants/page';
  import FaqCard from '../FaqCard.svelte';
  import { ArrowLeft, ArrowRight } from 'carbon-icons-svelte';

  const heroSection = $derived(getPageSection($homePage, SECTION.HERO));
  const courseSection = $derived(getPageSection($homePage, SECTION.COURSE));
  const ctaSection = $derived(getPageSection($homePage, SECTION.CTA));
  const aboutSection = $derived(getPageSection($homePage, SECTION.ABOUT));
  const faqSection = $derived(getPageSection($homePage, SECTION.FAQ));
  const testimonialSection = $derived(getPageSection($homePage, SECTION.TESTIMONIAL));

  let viewAll = false;
  let scrollContainer: HTMLElement | undefined = $state();

  function scrollLeft() {
    scrollContainer?.scrollBy({ left: -300, behavior: 'smooth' });
  }

  function scrollRight() {
    scrollContainer?.scrollBy({ left: 300, behavior: 'smooth' });
  }
</script>

<section class="bg-black text-white">
  <div class="mx-auto flex w-full items-start px-4 md:w-[80%] md:px-0 lg:gap-4">
    <div class="w-full">
      {#if heroSection?.show}
        <section class="flex min-h-[70vh] items-center justify-center overflow-hidden px-2 py-20">
          <div class=" flex w-full items-start justify-start gap-4">
            <div class="mb-4 w-full space-y-6">
              <p class="w-full text-3xl font-semibold md:w-[70%]">{heroSection.settings.title}</p>
              <p class="w-full font-medium text-gray-400 md:w-[60%]">
                {heroSection.settings.subtitle}
              </p>

              <PrimaryButton
                href={heroSection?.settings.action.link}
                label={heroSection?.settings.action.label}
              ></PrimaryButton>
            </div>
          </div>
        </section>
      {/if}

      <!-- about -->
      {#if aboutSection?.show}
        <div class="space-y-10 py-10">
          <div class="flex flex-col items-start justify-around md:flex-row">
            <p class="mb-4 text-4xl font-semibold md:mb-0 md:w-[30%]">
              {aboutSection.settings.title}
            </p>
            <p class="text-lg font-medium text-gray-300 md:w-[50%]">
              {aboutSection.settings.subtitle}
            </p>
          </div>

          <div class="mx-auto flex w-full flex-wrap items-center justify-center gap-6">
            {#each aboutSection.settings.benefits.list as benefits}
              <div class="bg-transperant border-linear-border max-w-[450px] rounded-md border p-8">
                <div class="mb-2 flex items-center gap-2">
                  <div class="size-5 bg-linear/50 flex items-center justify-center rounded-full">
                    <span class="size-3 bg-linear animate-pulse rounded-full"></span>
                  </div>
                  <p class="font-slab line-clamp-2 w-[90%] text-xl">
                    {benefits.title}
                  </p>
                </div>
                <p
                  class="font-roboto mb-4 line-clamp-5 w-[90%] text-sm text-gray-300 lg:line-clamp-4 lg:text-base"
                >
                  {benefits.subtitle}
                </p>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- courses -->

      {#if courseSection?.show}
        <section id="course" class="h-full pb-20 pt-4 md:px-5">
          <div class=" mb-4 md:pl-4">
            <h1 class="mb-2 text-start text-3xl font-bold">
              {courseSection.settings.title}
            </h1>
            <p class="w-[70%] text-start text-gray-300">
              {courseSection.settings.subtitle}
            </p>
          </div>

          {#if $courses.length > 0}
            <section class="grid w-full grid-cols-1 place-items-center gap-4 py-2 md:grid-cols-3">
              {#each $courses.slice(0, viewAll ? $courses.length : 3) as courseData}
                <CourseCard
                  slug={courseData.slug}
                  title={courseData.title}
                  bannerImage={courseData.banner}
                  cost={courseData.cost}
                  description={courseData.description}
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
              <EmptyState className="bg-black/90 border-linear-border" />
            </div>
          {/if}
        </section>
      {/if}

      <!-- testimonial -->
      {#if testimonialSection?.show}
        <section id="testimonial" class="h-full px-4 pb-20 pt-4 lg:px-20">
          <div class="mb-4 md:pl-4">
            <h1 class="mb-4 text-start text-3xl font-bold">Testimonial</h1>
            <p class="text-gray-300 md:w-[60%]">
              Hear from our learners who transformed their careers with our courses.
            </p>
          </div>
          <section
            class="mx-auto grid w-full grid-cols-1 place-items-center gap-6 md:w-fit md:grid-cols-2"
          >
            {#each testimonialSection.settings.list as item, i}
              <TestimonialCard description={item.description} name={item.name} index={i} />
            {/each}
          </section>
        </section>
      {/if}

      <!-- faq -->
      {#if faqSection?.show}
        <section id="faq" class="h-full px-2 pb-20 pt-4">
          <h1 class="mb-4 text-start text-3xl font-bold">{faqSection.settings.title}</h1>
          <p class="text-gray-300">{faqSection.settings.subtitle}</p>
          <!-- <section class="mx-auto flex w-full flex-wrap gap-4"> -->
          <div class="w-full overflow-x-hidden">
            <section
              bind:this={scrollContainer}
              class="scrollbar-hide flex w-full items-center gap-4 overflow-x-auto py-4 pr-2"
            >
              {#each faqSection.settings.questions as faq, index}
                <FaqCard {index} {faq} />
              {/each}
            </section>

            <div class=" hidden items-center justify-end gap-2 md:flex">
              <button
                class="border-linear-border text-linear-border hover:bg-linear-border flex w-fit items-center justify-center rounded-full border bg-transparent p-2 hover:text-black"
                onclick={scrollLeft}
              >
                <ArrowLeft />
              </button>
              <button
                class="border-linear-border text-linear-border hover:bg-linear-border flex w-fit items-center justify-center rounded-full border bg-transparent p-2 hover:text-black"
                onclick={scrollRight}
              >
                <ArrowRight class="" />
              </button>
            </div>
          </div>
        </section>
      {/if}

      <!-- footernote -->
    </div>
  </div>
  {#if ctaSection?.show}
    <section
      class="gradient-bg flex flex-col items-center justify-between px-6 py-20 md:flex-row lg:px-10"
    >
      <div class="flex w-full items-center justify-center">
        <p
          class="w-full text-center text-4xl font-bold capitalize text-white md:text-start lg:w-[70%]"
        >
          {ctaSection.settings.title}
        </p>
      </div>
      <div class="my-5 flex w-full items-center justify-center">
        <PrimaryButton
          href={ctaSection.settings?.button?.link}
          label={ctaSection.settings?.button?.label}
        />
      </div>
    </section>
  {/if}
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
  /* .break-inside-avoid {
    break-inside: avoid;
  } */
</style>
