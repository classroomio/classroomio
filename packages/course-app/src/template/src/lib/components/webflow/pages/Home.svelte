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
  import Accordion from '../Accordion.svelte';
  import TestimonialCard from '../TestimonialCard.svelte';
  import PrimaryButton from '../PrimaryButton.svelte';
  import { SECTION } from '@/utils/constants/page';

  const heroSection = $derived(getPageSection($homePage, SECTION.HERO));
  const courseSection = $derived(getPageSection($homePage, SECTION.COURSE));
  const faqSection = $derived(getPageSection($homePage, SECTION.FAQ));
  const testimonialSection = $derived(getPageSection($homePage, SECTION.TESTIMONIAL));

  let viewAll = false;

  let scrollPosition = $state(0);

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
  <div class="flex items-start lg:gap-4">
    <div class="w-full">
      {#if heroSection?.show}
        <section
          class="flex min-h-[50vh] items-center justify-center overflow-hidden px-2 py-20 lg:px-14"
        >
          <div
            class="relative flex w-full flex-col-reverse items-center justify-center gap-5 text-center md:flex-col lg:ml-auto lg:w-[80%]"
          >
            <DotPattern
              class="[mask-image:radial-gradient(30vw_circle_at_center,white,transparent)]"
            />
            <div class="z-10 mb-4 w-full space-y-6">
              <p class="mx-auto w-full text-3xl font-bold md:w-[90%] md:text-6xl">
                {#each letters as letter, index}
                  <span>
                    {letter}
                  </span>
                {/each}
              </p>
              <p class="mx-auto w-full text-lg md:w-[70%]">
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
              <PrimaryButton
                href={heroSection?.settings.action.link}
                label={heroSection?.settings.action.label}
              >
                <DirectionStraightRight
                  class="transition-transform duration-300 group-hover:translate-x-1"
                />
              </PrimaryButton>
            </div>
          </div>
        </section>
      {/if}

      <!-- <div class="fixed lg:sticky top-2 left-[5%] lg:left-[2%] w-[90%] mx-auto lg:w-fit z-50">
            <Navigation />
          </div> -->

      <!-- courses -->
      <div class="w-full lg:ml-auto lg:w-[80%]">
        {#if courseSection?.show}
          <section id="course" class="h-full px-2 pb-20 pt-4 md:px-5">
            <h1 class="mb-2 pl-2 text-start text-3xl font-bold">
              {courseSection.settings.title}
            </h1>
            <p class="mb-2 pl-2 text-start text-[#878787]">{courseSection.settings.subtitle}</p>

            {#if $courses.length > 0}
              <section class="grid w-full grid-cols-1 place-items-center gap-4 p-2 md:grid-cols-3">
                {#each $courses.slice(0, viewAll ? $courses.length : 3) as courseData}
                  <CourseCard
                    slug={courseData.slug}
                    title={courseData.title}
                    bannerImage={courseData.banner}
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
                <EmptyState className="dark:bg-[#232429] dark:border-[#EAEAEA]" />
              </div>
            {/if}
          </section>
        {/if}

        <!-- faq -->
        {#if faqSection?.show}
          <section id="faq" class="h-full px-2 pb-20 pt-4">
            <h1 class="mb-4 text-center text-3xl font-bold">{faqSection.settings.title}</h1>
            <section class="mx-auto w-full space-y-2 px-2 py-5">
              {#each faqSection.settings.questions as faq}
                <Accordion title={faq.title} content={faq.content} />
              {/each}
            </section>
          </section>
        {/if}

        <!-- testimonial -->
        {#if testimonialSection?.show}
          <section id="testimonial" class="h-full px-4 pb-20 pt-4 lg:px-5">
            <h1 class="mb-4 text-start text-3xl font-bold">Testimonial</h1>
            <section
              class="grid grid-cols-1 place-items-center gap-4 md:grid-cols-2 xl:grid-cols-3"
            >
              {#each testimonialSection.settings.list as item, i}
                <TestimonialCard description={item.description} name={item.name} index={i} />
              {/each}
            </section>
          </section>
        {/if}
      </div>
    </div>
    <!-- <Footer data={org} /> -->
  </div>
</section>
