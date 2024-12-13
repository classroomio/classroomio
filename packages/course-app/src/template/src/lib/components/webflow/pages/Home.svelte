<script lang="ts">
  import { goto } from '$app/navigation';
  import { Button } from '$lib/components/ui/button';
  import { getPageSection } from '@/utils/helpers/page';
  import { homePage } from '@/utils/stores/pages';
  import DirectionStraightRight from 'carbon-icons-svelte/lib/DirectionStraightRight.svelte';
  import { onMount } from 'svelte';
  import EmptyState from '../EmptyState.svelte';

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
          class="flex items-center justify-center py-16 px-2 lg:px-14 min-h-[100vh] lg:min-h-full overflow-hidden
                 bg-[radial-gradient(ellipse_at_top_right,_rgba(11,92,215,0.6)_1%,_rgba(0,0,0,0.8)_30%,_transparent_40%),radial-gradient(ellipse_at_bottom_left,_rgba(11,92,215,0.3)_10%,_rgba(0,0,0,0.8)_30%,_transparent_50%)]"
        >
          <section
            class="w-full lg:ml-auto lg:w-[80%] flex flex-col-reverse md:flex-col text-center items-center gap-5 justify-center"
          >
            <div class="space-y-6 w-full mb-4">
              <p class="text-3xl md:text-6xl font-bold w-full md:w-[90%] mx-auto">
                {#each letters as letter, index}
                  <span
                    style="opacity: {Math.max(0, 1 - (scrollPosition - index * 10) / 50)}"
                    class="transition-opacity duration-300"
                  >
                    {letter}
                  </span>
                {/each}
              </p>
              <p class="w-full text-lg md:w-[70%] mx-auto">
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
                onClick={() => {
                  goto(heroSection?.settings.action.link);
                }}
                label={heroSection?.settings.action.label}
              >
                <DirectionStraightRight
                  class="transition-transform duration-300 group-hover:translate-x-1"
                />
              </PrimaryButton>
            </div>
          </section>
        </section>
      {/if}

      <!-- <div class="fixed lg:sticky top-2 left-[5%] lg:left-[2%] w-[90%] mx-auto lg:w-fit z-50">
            <Navigation />
          </div> -->

      <!-- courses -->
      <div class="w-full lg:ml-auto lg:w-[80%]">
        {#if courseSection?.show}
          <section id="course" class="px-2 pt-4 pb-20 h-full md:px-5">
            <h1 class="text-start text-3xl mb-2 font-bold pl-2">
              {courseSection.settings.title}
            </h1>
            <p class="text-start text-[#878787] mb-2 pl-2">{courseSection.settings.subtitle}</p>

            {#if $courses.length > 0}
              <section class="grid place-items-center gap-4 grid-cols-1 md:grid-cols-3 w-full p-2">
                {#each $courses.slice(0, viewAll ? $courses.length : 3) as courseData}
                  <CourseCard
                    slug={courseData.slug}
                    title={courseData.title}
                    bannerImage={courseData.banner}
                    description={courseData.description}
                  />
                {/each}
              </section>
              {#if $courses.length > 1}
                <div class="w-full flex items-center justify-center my-5 px-2">
                  <Button
                    on:click={() => {
                      goto('/courses');
                    }}
                    class="group bg-[#0737BE] hover:bg-[#0737BE] rounded-none text-white gap-6 w-full"
                  >
                    View all courses
                    <DirectionStraightRight
                      class="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </Button>
                </div>
              {/if}
            {:else}
              <div class="w-full mx-auto">
                <EmptyState className="dark:bg-[#232429] dark:border-[#EAEAEA]" />
              </div>
            {/if}
          </section>
        {/if}

        <!-- faq -->
        {#if faqSection?.show}
          <section id="faq" class="px-2 pt-4 pb-20 h-full">
            <h1 class="text-center text-3xl font-bold mb-4">{faqSection.settings.title}</h1>
            <section class="py-5 px-2 space-y-2 w-full mx-auto">
              {#each faqSection.settings.questions as faq}
                <Accordion title={faq.title} content={faq.content} />
              {/each}
            </section>
          </section>
        {/if}

        <!-- testimonial -->
        {#if testimonialSection?.show}
          <section id="testimonial" class="px-4 lg:px-5 pt-4 pb-20 h-full">
            <h1 class="text-start text-3xl font-bold mb-4">Testimonial</h1>
            <section
              class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 place-items-center gap-4"
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
