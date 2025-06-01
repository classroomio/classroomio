<script>
  import { getPageSection } from '@/utils/helpers/page';
  import { homePage } from '@/utils/stores/pages';
  import PrimaryButton from '../PrimaryButton.svelte';
  import { courses } from '@/utils/stores/course';
  import CourseCard from '../CourseCard.svelte';
  import TestimonialCard from '../TestimonialCard.svelte';
  import EmptyState from '../EmptyState.svelte';
  import { SECTION } from '@/utils/constants/page';
  import bannerImg from '../assets/org-banner.png';
  import aboutBanner from '../assets/about-banner.png';

  const coursesSection = $derived(getPageSection($homePage, SECTION.COURSE));
  const aboutSection = $derived(getPageSection($homePage, SECTION.ABOUT));
  const testimonialSection = $derived(getPageSection($homePage, SECTION.TESTIMONIAL));
  const ctaSection = $derived(getPageSection($homePage, SECTION.CTA));

  let viewAll = $state(false);
</script>

<main>
  <!-- hero -->
  {#if $homePage}
    {@const content = getPageSection($homePage, SECTION.HERO)}
    {#if content?.show}
      <section class="flex min-h-full items-center justify-center bg-black/90 px-10 py-10 md:px-14">
        <div class="mx-auto flex max-w-6xl flex-col items-center gap-10 text-center">
          <div class="w-full space-y-6 text-white">
            <p class="mx-auto w-full text-3xl font-normal md:w-[60%] md:text-4xl">
              {content.settings.title}
            </p>

            <p class="mx-auto w-full font-normal md:w-[70%] md:text-lg">
              {content.settings.subtitle}
            </p>
          </div>
          <div
            class="flex h-[250px] max-h-[300px] w-[800px] max-w-[80vw] rounded-lg lg:max-w-[80%]"
          >
            <img
              style="min-width:280px; min-height:200px"
              alt="landing page banner"
              src={content.settings.banner.image ? content.settings.banner.image : bannerImg}
              class="h-full max-h-[300px] w-full rounded-lg object-cover"
            />
          </div>
          <PrimaryButton
            class="rounded-none px-6 font-bold uppercase"
            label={content.settings.action.label}
            href={content.settings.action.link}
          />
        </div>
      </section>
    {/if}
  {/if}

  <!-- about -->
  {#if aboutSection?.show}
    <section class="relative w-full bg-white px-4 py-10 lg:px-14">
      <div
        class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row md:items-start"
      >
        <div class="mb-5 w-full md:mr-5 md:w-[60%] lg:mb-0 lg:w-[50%]">
          <p class="mb-8 w-full text-2xl font-normal md:w-[90%] md:text-3xl lg:text-4xl">
            {aboutSection.settings.title}
          </p>
          <div class="space-y-3">
            {#each aboutSection.settings.benefits.list as items}
              <div class="max-w-[579px] rounded-md border border-gray-100 bg-gray-50 p-8">
                <p class="mb-2 line-clamp-2 w-[90%] text-xl md:text-2xl">{items.title}</p>
                <p
                  class="mb-4 line-clamp-5 w-[90%] text-sm text-gray-600 lg:line-clamp-4 lg:text-base"
                >
                  {items.subtitle}
                </p>
              </div>
            {/each}
          </div>
        </div>

        <div class="image sticky top-0 hidden md:block">
          <img
            src={aboutSection.settings.imageUrl || aboutBanner}
            alt="Our Story"
            class="h-[450px] w-[450px] object-cover"
          />
        </div>
      </div>
    </section>
  {/if}

  <!-- courses -->
  {#if coursesSection?.show}
    <section id="course" class="h-full bg-white p-4 lg:p-20">
      <div class="mx-4 mb-4">
        <span class="mb-4 space-y-2 lg:mb-0">
          <p class="text-2xl lg:text-3xl">{coursesSection.settings.title}</p>
          <p class="w-[80%] text-gray-600">{coursesSection.settings.subtitle}</p>
        </span>
      </div>

      {#if $courses.length > 0}
        <section class="flex flex-wrap items-center justify-center gap-4 p-4 md:justify-start">
          {#each $courses.slice(0, viewAll ? $courses.length : 3) as courseData}
            <CourseCard
              slug={courseData.slug}
              bannerImage={courseData.banner}
              title={courseData.title}
            />
          {/each}
        </section>
        {#if $courses.length > 3}
          <div class="my-5 flex w-full items-center justify-center">
            <PrimaryButton
              label="VIEW MORE"
              class="bg-bootcamp rounded-none text-lg"
              onClick={() => (viewAll = !viewAll)}
            />
          </div>
        {/if}
      {:else}
        <div class="px-10">
          <EmptyState className="bg-slate-100" />
        </div>
      {/if}
    </section>
  {/if}
  <!-- <LearningPath /> -->
  <!-- testimonial -->
  {#if testimonialSection?.show}
    <section class="h-full bg-white p-4 lg:p-20">
      <p class="mb-10 text-center text-2xl lg:text-3xl">See what our learners say</p>

      <div class="mx-auto space-y-2 md:space-y-4 lg:w-[80%]">
        {#each testimonialSection.settings.list as testimonial, index}
          <TestimonialCard
            profileImage={testimonial.image}
            title={testimonial.name}
            role={testimonial.role}
            description={testimonial.description}
            {index}
          />
        {/each}
      </div>
    </section>
  {/if}

  <!-- cta -->
  {#if ctaSection?.show}
    <section class="bg-bootcamp flex flex-col items-center justify-between px-6 py-20 lg:px-10">
      <div class="flex w-full items-center justify-center">
        <p class="w-full text-center text-4xl font-bold capitalize text-white lg:w-[70%]">
          {ctaSection.settings.title}
        </p>
      </div>
      <div class="my-5 flex w-full items-center justify-center">
        <PrimaryButton
          label={ctaSection.settings.button.label}
          href={ctaSection.settings.button.link}
          class="text-md rounded-none bg-white px-10 py-4 uppercase text-black"
        />
      </div>
    </section>
  {/if}
</main>
