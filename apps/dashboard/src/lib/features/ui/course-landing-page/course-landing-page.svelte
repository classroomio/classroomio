<script lang="ts">
  import get from 'lodash/get';
  import pluralize from 'pluralize';
  import { page } from '$app/state';
  import { onMount, onDestroy } from 'svelte';
  import { resolve } from '$app/paths';
  import type { Component } from 'svelte';
  import { SafeHtmlContent } from '@cio/ui/custom/safe-html-content';
  import PlayIcon from '@lucide/svelte/icons/play';
  import UserIcon from '@lucide/svelte/icons/user';
  import StarIcon from '@lucide/svelte/icons/star';
  import UsersIcon from '@lucide/svelte/icons/users';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import ClockIcon from '@lucide/svelte/icons/clock';

  import { BlurFade } from '@cio/ui/custom/animation/blurfade';
  import { Sparkle } from '@cio/ui/custom/animation/sparkle';
  import { MagicCard } from '@cio/ui/custom/animation/magic-card';

  import { getLectureNo } from '$features/course/utils/functions';
  import {
    importThemeNavHero,
    normalizeLandingPageSettings,
    themeHeaderShellClass,
    themeStyle,
    themeRendersNavInsideHero
  } from '$features/org/utils/landing-page';
  import { currentOrg } from '$lib/utils/store/org';
  import { basePath } from '$lib/utils/store/app';
  import { user } from '$lib/utils/store/user';
  import { NAV_ITEM_KEY, NAV_ITEMS } from './constants';
  import { t } from '$lib/utils/functions/translations';
  import { calDateDiff } from '$lib/utils/functions/date';
  import { handleOpenWidget, reviewsModalStore } from './store';
  import type { Course, CourseMetadata } from '$features/course/utils/types';
  import { courseApi } from '$features/course/api';
  import { filterNavItems, getCourseLessons, getCourseSections, getTotalLessons } from './utils';
  import { Button } from '@cio/ui/base/button';

  import { Chip } from '@cio/ui/custom/chip';
  import * as UnderlineTabs from '@cio/ui/custom/underline-tabs';
  import * as Dialog from '@cio/ui/base/dialog';
  import Image from '$features/ui/image.svelte';
  import PoweredBy from '$features/ui/powered-by.svelte';
  import UploadWidget from '$features/ui/upload-widget/upload-widget.svelte';
  import HTMLRender from '$features/ui/html-render.svelte';
  import * as Avatar from '@cio/ui/base/avatar';
  import PricingSection from './components/pricing-section.svelte';
  import NavSection from './components/nav-section.svelte';
  import SectionsDisplay from './components/sections-display.svelte';
  import { observeIntersection } from './components/intersection-observer';

  interface Props {
    editMode?: boolean;
    courseData: Course;
    showStandaloneShell?: boolean;
  }

  let { editMode = false, courseData = $bindable(), showStandaloneShell = false }: Props = $props();

  /** Editor / standalone shell: show org-theme hero + nav from `currentOrg.landingpage`. Org-site embed omits (parent provides hero). */
  const showMarketingHero = $derived(showStandaloneShell || editMode);

  const landingSettings = $derived(normalizeLandingPageSettings($currentOrg.landingpage));

  const heroShellClass = $derived(`ui:w-full ${themeHeaderShellClass(landingSettings.theme)}`);
  const heroShellStyle = $derived(themeStyle(landingSettings.theme));
  const navInsideHero = $derived(themeRendersNavInsideHero(landingSettings.theme));

  const orgNameForNav = $derived($currentOrg.name || get(courseData, 'org.name', '') || 'ClassroomIO');
  const logoUrlForNav = $derived($currentOrg.avatarUrl || undefined);

  const authAction = $derived(
    $user.isLoggedIn
      ? {
          label: t.get($basePath === '/lms' || $basePath === '#' ? 'navigation.goto_lms' : 'navigation.goto_dashboard'),
          href: resolve($basePath !== '#' ? $basePath : '/lms', {})
        }
      : {
          label: t.get('navigation.login'),
          href: '/login'
        }
  );

  const courseHero = $derived.by(() => {
    const slug = typeof courseData.slug === 'string' && courseData.slug.length > 0 ? courseData.slug : '';
    const enrollHref = slug ? resolve(`/course/${slug}/enroll`, {}) : '#';
    const enrollmentsOpen = get(courseData, 'metadata.allowNewStudent') === true;

    return {
      ...landingSettings.hero,
      heading: get(courseData, 'title', '') || landingSettings.hero.heading,
      subheading: get(courseData, 'description', '') || landingSettings.hero.subheading,
      primaryAction: {
        label: t.get('course.navItem.landing_page.start_course'),
        href: enrollHref,
        disabled: editMode || !enrollmentsOpen
      },
      image: get(courseData, 'logo', '') || landingSettings.hero.image
    };
  });

  /** Matches API `buildCourseContent` — do not use `metadata.isContentGroupingEnabled` (dashboard normalizes undefined → true). */
  const lessonsLayoutIsGrouped = $derived(courseData.content?.grouped === true);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let NavComponent = $state<Component<any> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let HeroComponent = $state<Component<any> | null>(null);

  $effect(() => {
    if (!showMarketingHero) {
      NavComponent = null;
      HeroComponent = null;

      return;
    }

    const theme = landingSettings.theme;
    let cancelled = false;

    void importThemeNavHero(theme).then(({ NavComponent: nav, HeroComponent: hero }) => {
      if (!cancelled) {
        NavComponent = nav;
        HeroComponent = hero;
      }
    });

    return () => {
      cancelled = true;
    };
  });

  const reviews = $derived(get(courseData, 'metadata.reviews') || []);

  const lessons = $derived(getCourseLessons(courseData));
  const totalRatings = $derived(reviews?.reduce((acc = 0, review) => acc + (review?.rating || 0), 0));
  const averageRating = $derived(reviews?.length ? (totalRatings / reviews.length).toFixed(1) : null);
  const expandDescription = $derived(Array(reviews?.length ?? 0).fill(false));

  const instructor = $derived((get(courseData, 'metadata.instructor') || {}) as Record<string, unknown>);
  const organizationName = $derived(get(courseData, 'org.name') || $currentOrg.name || '');
  const instructorName = $derived.by(() => {
    const name = get(instructor, 'name');
    return typeof name === 'string' && name.trim().length > 0 ? name : organizationName;
  });
  const instructorImageUrl = $derived.by(() => {
    const imageUrl = get(instructor, 'imgUrl');
    return typeof imageUrl === 'string' && imageUrl.trim().length > 0 ? imageUrl : '/images/avatar.svg';
  });
  const certificate = $derived(
    get(courseData, 'metadata.certificate', {
      templateUrl: '/images/certificate-template.svg'
    }) as CourseMetadata['certificate']
  );

  const navItems = $derived(filterNavItems(courseData, reviews));
  const navItemKeys = $derived(navItems.map((item) => item.key));

  let startCoursePayment = $state(false);
  let isVisible = $state(false);
  let observer: { destroy: () => void };

  let activeNav = $state(NAV_ITEMS[0].key);

  const courseSections = $derived(getCourseSections(courseData));
  const totalLessons = $derived(getTotalLessons(courseSections));
  const studentCount = $derived(courseData.group?.members?.length ?? 0);

  function locationHashChanged() {
    activeNav = window.location.hash;
  }

  function toggleDescription(id: number) {
    expandDescription[id] = !expandDescription[id];
  }

  onMount(() => {
    window.onhashchange = locationHashChanged;

    const targetNode = document.querySelector('.target-component');
    observer = observeIntersection(targetNode, (inView: boolean) => {
      isVisible = inView;
    });
  });

  onDestroy(() => {
    observer?.destroy();
  });
</script>

{#if !editMode && showStandaloneShell}
  <PoweredBy />
{/if}

<div class="flex w-full flex-col items-center bg-white dark:bg-black">
  {#if showMarketingHero}
    <div class={heroShellClass} style={heroShellStyle}>
      {#if NavComponent && HeroComponent}
        {#if navInsideHero}
          <HeroComponent hero={courseHero} orgName={orgNameForNav}>
            {#snippet navigation()}
              <NavComponent
                orgName={orgNameForNav}
                logoUrl={logoUrlForNav}
                navItems={landingSettings.navItems}
                {authAction}
              />
            {/snippet}
          </HeroComponent>
        {:else}
          <NavComponent
            orgName={orgNameForNav}
            logoUrl={logoUrlForNav}
            navItems={landingSettings.navItems}
            {authAction}
          />
          <HeroComponent hero={courseHero} orgName={orgNameForNav} />
        {/if}
      {/if}

      {#if editMode && $handleOpenWidget.open}
        <div class="mx-auto w-full max-w-7xl px-6 py-2">
          <UploadWidget imageURL={courseApi.course?.logo} onchange={(newLogo) => (courseApi.course!.logo = newLogo)} />
        </div>
      {/if}
    </div>

    <!-- Social Proof Strip -->
    {#if reviews.length > 0 || studentCount > 0 || lessons.length > 0}
      <div class="w-full border-b border-gray-200 bg-gray-50 dark:border-neutral-800 dark:bg-neutral-900">
        <div
          class="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-6 px-6 py-4 text-sm md:justify-start"
        >
          {#if averageRating}
            <div class="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
              <StarIcon size={16} class="fill-yellow-400 text-yellow-400" />
              <span class="font-semibold">{averageRating}</span>
              <span class="text-gray-500 dark:text-gray-400"
                >({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span
              >
            </div>
          {/if}
          {#if studentCount > 0}
            <div class="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
              <UsersIcon size={16} />
              <span>{studentCount} {studentCount === 1 ? 'student' : 'students'}</span>
            </div>
          {/if}
          {#if lessons.length > 0}
            <div class="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
              <BookOpenIcon size={16} />
              <span>{pluralize('lesson', lessons.length, true)}</span>
            </div>
          {/if}
          {#if courseData.type}
            <div class="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
              <ClockIcon size={16} />
              <span>{courseData.type === 'LIVE_CLASS' ? 'Live Class' : 'Self-Paced'}</span>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  {/if}

  <!-- Body -->
  <div class="w-full bg-white dark:bg-black">
    <div
      class="mx-auto my-2 flex w-full max-w-6xl flex-col-reverse items-center justify-between px-4 lg:flex-row lg:items-start lg:py-8"
    >
      <!-- Course Details -->
      <div class="w-full max-w-[680px] min-w-[60%] p-3 lg:mr-10">
        <!-- Navigation -->
        <UnderlineTabs.Root bind:value={activeNav} class="py-2">
          <UnderlineTabs.List>
            {#each navItems as navItem (navItem.key)}
              <UnderlineTabs.Trigger value={navItem.key}>
                <a href={resolve(page.url.pathname + navItem.key, {})}>
                  {$t(navItem.label)}
                </a>
              </UnderlineTabs.Trigger>
            {/each}
          </UnderlineTabs.List>
        </UnderlineTabs.Root>

        <!-- Sections - Requirement -->
        {#if navItemKeys.includes(NAV_ITEM_KEY.REQUIREMENT)}
          <NavSection id="requirement">
            <BlurFade delay={0.1}>
              <h3 class="mt-0 mb-3 text-2xl font-semibold">
                {$t('course.navItem.landing_page.requirement')}
              </h3>
              <HTMLRender className="text-sm font-light leading-relaxed">
                <SafeHtmlContent content={get(courseData, 'metadata.requirements', '')} />
              </HTMLRender>
            </BlurFade>
          </NavSection>
        {/if}

        <!-- Sections - Course Description -->
        {#if navItemKeys.includes(NAV_ITEM_KEY.DESCRIPTION)}
          <NavSection id="description">
            <BlurFade delay={0.1}>
              <h3 class="mt-0 mb-3 text-2xl font-semibold">
                {$t('course.navItem.landing_page.description')}
              </h3>
              <HTMLRender className="dark:text-white text-sm font-light leading-relaxed">
                <SafeHtmlContent content={get(courseData, 'metadata.description', '')} />
              </HTMLRender>
            </BlurFade>
          </NavSection>
        {/if}

        <!-- Sections - Goal -->
        {#if navItemKeys.includes(NAV_ITEM_KEY.GOALS)}
          <NavSection id="goals">
            <BlurFade delay={0.1}>
              <h3 class="mt-0 mb-3 text-2xl font-semibold">{$t('course.navItem.landing_page.learn')}</h3>
              <HTMLRender className="text-sm font-light leading-relaxed">
                <SafeHtmlContent content={get(courseData, 'metadata.goals', '')} />
              </HTMLRender>
            </BlurFade>
          </NavSection>
        {/if}

        <!-- Sections - Certificate -->
        {#if navItemKeys.includes(NAV_ITEM_KEY.CERTIFICATE)}
          <NavSection id="certificate">
            <BlurFade delay={0.1}>
              <h3 class="mt-0 text-2xl font-semibold">{$t('course.navItem.landing_page.certificate')}</h3>
              <p class="mb-4 text-sm font-light dark:text-white">
                {$t('course.navItem.landing_page.certificate_text')}
              </p>
              <MagicCard
                gradientColor="#3b82f6"
                gradientOpacity={0.15}
                class="inline-block w-auto border-0 bg-transparent py-0 dark:bg-transparent"
              >
                <Image src={certificate?.templateUrl} alt="certificate template" className="max-h-[215px] w-auto" />
              </MagicCard>
            </BlurFade>
          </NavSection>
        {/if}

        <!-- Sections - Lessons (layout follows `content.grouped` from API, not client-normalized metadata) -->
        {#if !lessonsLayoutIsGrouped}
          <NavSection id="lessons">
            <BlurFade delay={0.1}>
              <div class="mb-3 flex w-full items-center justify-between">
                <h3 class="mt-0 mb-3 text-2xl font-semibold">
                  {$t('course.navItem.landing_page.content')}
                </h3>
                <p class="text-sm font-light dark:text-white">
                  {pluralize('lesson', lessons.length, true)}
                </p>
              </div>

              <div class="flex flex-wrap gap-2">
                {#each lessons as lesson, index (lesson.id)}
                  <BlurFade delay={0.05 * Math.min(index, 10)}>
                    <div
                      class="rounded-lg border border-gray-200 px-3 py-1.5 transition-colors hover:border-gray-400 dark:border-neutral-700 dark:hover:border-neutral-500"
                    >
                      <Chip value={getLectureNo(index + 1, '0')} />
                      <p class="ml-2 inline text-xs font-light dark:text-white">
                        {lesson.title}
                      </p>
                    </div>
                  </BlurFade>
                {/each}
              </div>
            </BlurFade>
          </NavSection>
        {:else}
          <NavSection id="lessons">
            <BlurFade delay={0.1}>
              <!-- header -->
              <div class="flex items-center justify-between">
                <h1 class="text-2xl font-semibold">{$t('course.navItem.landing_page.course_content')}</h1>
                <span class="text-xs font-normal">
                  {pluralize($t('course.navItem.landing_page.modules'), courseSections.length, true)},
                  {pluralize($t('course.navItem.landing_page.lessons'), totalLessons, true)}
                </span>
              </div>

              {#each courseSections as section, index (section.id)}
                <BlurFade delay={0.05 * Math.min(index, 8)}>
                  <SectionsDisplay
                    exerciseCount={section.exerciseCount}
                    lessonCount={section.lessons?.length}
                    lessons={section.lessons}
                    title={section.title!}
                  />
                </BlurFade>
              {/each}
            </BlurFade>
          </NavSection>
        {/if}

        <!-- Sections - Reviews -->
        {#if navItemKeys.includes(NAV_ITEM_KEY.REVIEWS)}
          <NavSection id="reviews">
            <BlurFade delay={0.1}>
              <div class="mb-6 flex items-center gap-3">
                <h2 class="text-2xl font-semibold">
                  {$t('course.navItem.landing_page.reviews')}
                </h2>
                {#if averageRating}
                  <Sparkle
                    text={averageRating}
                    colors={{ first: '#facc15', second: '#f97316' }}
                    sparklesCount={3}
                    class="text-xl font-bold"
                  />
                {/if}
              </div>
            </BlurFade>

            <div class="grid gap-4 sm:grid-cols-2">
              {#each reviews.slice(0, 4) as review, id (review.id)}
                {#if !review.hide}
                  <BlurFade delay={0.1 + id * 0.08}>
                    <div
                      class="flex flex-row items-start gap-3 rounded-lg border border-gray-100 p-4 dark:border-neutral-800"
                    >
                      <!-- image container -->
                      <Avatar.Root class="mt-1 size-10 shrink-0">
                        {#if review.avatar_url}
                          <Avatar.Image src={review.avatar_url} alt={review.name ? review.name : 'Avatar'} />
                        {/if}
                        <Avatar.Fallback>
                          <UserIcon class="ui:size-5 ui:text-muted-foreground" />
                        </Avatar.Fallback>
                      </Avatar.Root>

                      <!-- profile content -->
                      <div class="min-w-0 flex-1">
                        <p class="mb-0.5 font-medium">{review.name}</p>
                        <!-- ratings -->
                        <div class="mb-2 flex items-center gap-0.5">
                          {#each Array(5) as _, starIndex (starIndex)}
                            <StarIcon
                              size={14}
                              class={starIndex < (review.rating || 0)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300 dark:text-neutral-600'}
                            />
                          {/each}
                        </div>
                        <div class="mb-2 overflow-hidden" style:max-height={expandDescription[id] ? 'none' : '60px'}>
                          <p class="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                            {review.description}
                          </p>
                        </div>
                        {#if !expandDescription[id] && review.description.split(' ').length > 12}
                          <button
                            class="ui:text-primary text-sm font-normal underline"
                            onclick={() => toggleDescription(id)}>See More</button
                          >
                        {/if}
                        {#if expandDescription[id]}
                          <button
                            class="ui:text-primary text-sm font-normal underline"
                            onclick={() => toggleDescription(id)}>See Less</button
                          >
                        {/if}
                      </div>
                    </div>
                  </BlurFade>
                {/if}
              {/each}
            </div>
            {#if reviews.length > 4}
              <Button class="mt-4" variant="outline" onclick={() => ($reviewsModalStore.open = true)}>
                {$t('course.navItem.landing_page.see_all')}
              </Button>
            {/if}

            <!-- Reviews Modal -->
            <Dialog.Root bind:open={$reviewsModalStore.open}>
              <Dialog.Content class="w-9/12">
                <Dialog.Header>
                  <Dialog.Title>{$t('course.navItem.landing_page.reviews_modal.title')}</Dialog.Title>
                </Dialog.Header>
                <div class="flex">
                  <!-- ratings -->
                  <div class="w-1/3">
                    <h2 class="text-xl">
                      {averageRating}
                      {$t('course.navItem.landing_page.reviews_modal.rating')}
                    </h2>
                    <h2 class="mt-2 text-lg font-semibold">
                      {reviews.length}
                      {$t('course.navItem.landing_page.reviews_modal.ratings')}
                    </h2>
                  </div>
                  <!-- reviews -->
                  <div class="flex w-4/6 flex-wrap">
                    {#each reviews as review, id (review.id)}
                      <!-- review -->
                      <div class="my-2 flex w-full flex-row items-start">
                        <!-- image container -->
                        <Avatar.Root class="mt-1 h-10 w-10">
                          {#if review.avatar_url}
                            <Avatar.Image src={review.avatar_url} alt={review.name ? review.name : 'Avatar'} />
                          {/if}
                          <Avatar.Fallback>
                            <UserIcon class="ui:size-5 ui:text-muted-foreground" />
                          </Avatar.Fallback>
                        </Avatar.Root>

                        <!-- profile content -->
                        <div class="w-11/12 pl-2.5">
                          <p class="mb-0.5 font-medium">{review.name}</p>
                          <!-- ratings -->
                          <div class="flex flex-row items-center gap-1">
                            <div class="flex items-center gap-0.5">
                              {#each Array(5) as _, starIndex (starIndex)}
                                <StarIcon
                                  size={14}
                                  class={starIndex < (review.rating || 0)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300 dark:text-neutral-600'}
                                />
                              {/each}
                            </div>
                            <p class="text-xs text-gray-600">
                              {calDateDiff(review.created_at)}
                            </p>
                          </div>
                          <div
                            class="mb-2 overflow-hidden transition-all"
                            style:max-height={expandDescription[id] ? 'none' : '60px'}
                          >
                            <p class="my-2 text-sm leading-relaxed text-gray-600">
                              {review.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    {/each}
                  </div>
                </div>
              </Dialog.Content>
            </Dialog.Root>
          </NavSection>
        {/if}

        <!-- Sections - Instructor -->
        <NavSection id="instructor">
          <BlurFade delay={0.1}>
            <h3 class="mt-0 mb-4 text-2xl font-semibold">
              {$t('course.navItem.landing_page.instructor')}
            </h3>
            <div class="mb-4 flex items-center gap-4">
              <img
                alt="Author Avatar"
                class="block h-20 w-20 rounded-full object-cover ring-2 ring-gray-200 dark:ring-neutral-700"
                src={instructorImageUrl}
              />
              <div>
                <p class="text-base font-medium dark:text-white">
                  {instructorName}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {get(instructor, 'role', '')}
                </p>
                {#if get(instructor, 'courseNo', '')}
                  <p class="mt-1 flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                    <PlayIcon size={14} class="filled" />
                    <span>
                      {get(instructor, 'courseNo', '')}
                      {$t('course.navItem.landing_page.courses')}
                    </span>
                  </p>
                {/if}
              </div>
            </div>

            <p class="text-sm leading-relaxed font-light dark:text-white">
              {get(instructor, 'description', '')}
            </p>
          </BlurFade>
        </NavSection>
      </div>

      <!-- Pricing Details -->
      <PricingSection {courseData} {editMode} bind:startCoursePayment className="target-component" />
    </div>
    {#if !isVisible}
      <PricingSection {courseData} {editMode} bind:startCoursePayment mobile={true} className="w-full" />
    {/if}
  </div>
</div>

<style>
  :global(.list ul li) {
    margin-left: 1rem;
    list-style-type: disc;
  }
</style>
