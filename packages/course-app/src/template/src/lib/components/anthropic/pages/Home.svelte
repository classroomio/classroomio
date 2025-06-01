<script lang="ts">
  import { goto } from '$app/navigation';
  import { getPageSection } from '@/utils/helpers/page';
  import { homePage } from '@/utils/stores/pages';
  import { courses } from '$lib/utils/stores/course';
  import PrimaryButton from '../PrimaryButton.svelte';
  import CourseCard from '../CourseCard.svelte';
  import Accordion from '../../cal/Accordion.svelte';
  import TestimonialCard from '../../classic/TestimonialCard.svelte';
  import EmptyState from '../../cal/EmptyState.svelte';
  import { SECTION } from '@/utils/constants/page';

  /**
   * State
   */
  let scrollContainer: HTMLElement | undefined = $state();

  /**
   * Constants
   */
  const coursesSection = $derived(getPageSection($homePage, SECTION.COURSE));
  const aboutSection = $derived(getPageSection($homePage, SECTION.ABOUT));
  const faqSection = $derived(getPageSection($homePage, SECTION.FAQ));
  const testimonialSection = $derived(getPageSection($homePage, SECTION.TESTIMONIAL));
  const ctaSection = $derived(getPageSection($homePage, SECTION.CTA));

  /**
   * Functions
   */
  function scrollLeft() {
    scrollContainer?.scrollBy({ left: -300, behavior: 'smooth' });
  }

  function scrollRight() {
    scrollContainer?.scrollBy({ left: 300, behavior: 'smooth' });
  }
</script>

<main class="bg-[#FAF8F6] font-sans text-black">
  <!-- Hero Section -->
  {#if $homePage}
    {@const content = getPageSection($homePage, SECTION.HERO)}
    {#if content?.show}
      <section class="mx-auto max-w-7xl px-6 pb-8 pt-16">
        <div class="mb-8 flex flex-col gap-6 md:flex-row">
          <div class="flex flex-1 flex-col justify-between rounded-xl bg-[#E97B5A] p-8">
            <div class="mb-2 text-2xl font-bold">{content.settings.title}</div>
            <div class="mb-2 text-4xl font-black">{content.settings.titleHighlight}</div>
            <div class="mb-4 text-lg">{content.settings.subtitle}</div>
            <PrimaryButton
              label={content.settings.action?.label}
              onClick={() => {
                goto(content.settings.action?.link);
              }}
            />
          </div>
          {#if content.settings.banner?.image}
            <div class="flex flex-1 items-center justify-center">
              <img
                src={content.settings.banner.image}
                alt="Hero Banner"
                class="h-64 w-full rounded-xl object-cover"
              />
            </div>
          {/if}
        </div>
      </section>
    {/if}
  {/if}

  <!-- About Section -->
  {#if aboutSection?.show}
    <section class="mx-auto max-w-7xl px-6 py-12">
      <h1 class="mb-2 text-center text-5xl font-bold">{aboutSection.settings.title}</h1>
      <p class="mb-8 text-center text-lg font-semibold">{aboutSection.settings.subtitle}</p>
      {#if aboutSection.settings.benefits?.list?.length}
        <div class="flex flex-wrap justify-center gap-6">
          {#each aboutSection.settings.benefits.list as item}
            <div class="max-w-xs rounded-lg border bg-white p-4">
              <div class="mb-2 font-bold">{item.title}</div>
              <div class="text-sm text-[#878787]">{item.subtitle}</div>
            </div>
          {/each}
        </div>
      {/if}
    </section>
  {/if}

  <!-- Courses Section -->
  {#if coursesSection?.show}
    <section class="mx-auto max-w-7xl px-6 py-12">
      <h1 class="mb-4 text-3xl font-bold">{coursesSection.settings.title}</h1>
      {#if $courses.length > 0}
        <div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {#each $courses as course}
            <CourseCard
              slug={course.slug}
              bannerImage={course.banner}
              title={course.title}
              description={course.description}
            />
          {/each}
        </div>
      {:else}
        <EmptyState type="course" />
      {/if}
    </section>
  {/if}

  <!-- FAQ Section -->
  {#if faqSection?.show}
    <section class="mx-auto max-w-7xl px-6 py-12">
      <h1 class="mb-4 text-center text-5xl font-bold">{faqSection.settings.title}</h1>
      <div class="mx-auto w-full max-w-2xl">
        {#each faqSection.settings.questions as faq}
          <Accordion title={faq.title} content={faq.content} />
        {/each}
      </div>
    </section>
  {/if}

  <!-- Testimonial Section -->
  {#if testimonialSection?.show}
    <section class="mx-auto max-w-7xl px-6 py-12">
      <h1 class="mb-4 text-center text-3xl font-bold">Testimonials</h1>
      <div class="flex flex-wrap justify-center gap-6">
        {#each testimonialSection.settings.list as item}
          <TestimonialCard name={item.name} description={item.description} banner={item.banner} />
        {/each}
      </div>
    </section>
  {/if}

  <!-- CTA Section -->
  {#if ctaSection?.show}
    <section class="mx-auto max-w-7xl px-6 py-16 text-center">
      <h1 class="mb-4 text-4xl font-black">
        {ctaSection.settings.title}
        {ctaSection.settings.titleHighlight}
      </h1>
      <div class="mb-4 text-lg">{ctaSection.settings.subtitle}</div>
      <PrimaryButton
        label={ctaSection.settings?.button?.label}
        onClick={() => {
          goto(ctaSection.settings?.button?.link);
        }}
      />
    </section>
  {/if}
</main>

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
