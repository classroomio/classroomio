<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  import { resolve } from '$app/paths';
  import { CourseCard, DEFAULT_COURSE_BANNER_IMAGE } from '@cio/ui';
  import UserIcon from '@lucide/svelte/icons/user';
  import CircleDotIcon from '@lucide/svelte/icons/circle-dot';
  import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';

  import { Button } from '@cio/ui/base/button';
  import { Progress } from '@cio/ui/base/progress';

  import pluralize from 'pluralize';

  import { Image } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';
  import { calcCourseDiscount } from '$lib/utils/functions/course';
  import getCurrencyFormatter from '$lib/utils/functions/getCurrencyFormatter';
  import { calcCourseProgress, calcProgressRate } from '$features/course/utils/functions';
  import CardDropdown from './card-dropdown.svelte';
  import CoursePublishBadge from './course-publish-badge.svelte';
  import CourseTagsOverflow from './course-tags-overflow.svelte';
  import type { OrgCourses, UserEnrolledCourses } from '$features/course/types';
  import type { OrgPublicCourses } from '$features/org/utils/types';

  export interface Props {
    course: OrgCourses[number] | UserEnrolledCourses[number] | OrgPublicCourses[number];
    isOnLandingPage?: boolean;
    isLMS?: boolean;
    isExplore?: boolean;
    href?: string;
    actions?: Snippet;
  }

  let { course, isOnLandingPage, isLMS, isExplore, href, actions }: Props = $props();

  let {
    bannerImage,
    id = '',
    slug = '',
    title = '',
    description = '',
    isPublished = false,
    totalLessons = 0,
    totalExercises = 0,
    totalStudents = 0,
    currency = 'USD',
    progressRate = 45,
    type,
    pricingData = {
      cost: 0,
      discount: 0,
      showDiscount: false
    }
  } = $derived({
    id: course.id,
    slug: course.slug,
    bannerImage: course.logo || DEFAULT_COURSE_BANNER_IMAGE,
    title: course.title,
    type: course.type,
    description: course.description,
    isPublished: !!course.isPublished,
    pricingData: {
      cost: course.cost,
      discount: course.metadata?.discount || 0,
      showDiscount: course.metadata?.showDiscount || false
    },
    currency: course.currency,
    totalLessons: course.lessonCount,
    totalExercises: (() => {
      const c = course as { exerciseCount?: number };
      return typeof c.exerciseCount === 'number' ? c.exerciseCount : 0;
    })(),
    progressRate: (() => {
      const c = course as { exerciseCount?: number; exercisesCompleted?: number };
      if (typeof c.exerciseCount === 'number' && typeof c.exercisesCompleted === 'number') {
        return calcCourseProgress({
          lessonsCompleted: 'progressRate' in course ? (course.progressRate ?? 0) : 0,
          totalLessons: course.lessonCount ?? 0,
          exercisesCompleted: c.exercisesCompleted,
          totalExercises: c.exerciseCount
        });
      }
      return calcProgressRate('progressRate' in course ? course.progressRate : 0, course.lessonCount);
    })(),
    totalStudents: 'totalStudents' in course ? course.totalStudents : 0
  });

  let formatter = $derived(getCurrencyFormatter(currency));
  const courseTags = $derived(
    ('tags' in course && Array.isArray(course.tags) ? course.tags : []) as Array<{
      id: string;
      name: string;
      slug: string;
      color?: string | null;
    }>
  );

  const COURSE_TAG: Record<
    string,
    {
      style: string;
      label: string;
      icon: Component;
      iconStyle?: string;
    }
  > = {
    ['LIVE_CLASS']: {
      style: '',
      label: $t('course.navItem.settings.live_class'),
      icon: CircleDotIcon,
      iconStyle: 'custom text-red-700'
    },
    ['SELF_PACED']: {
      style: '',
      label: $t('course.navItem.settings.self_paced'),
      icon: UserIcon,
      iconStyle: 'custom ui:text-primary'
    },
    SPECIALIZATION: {
      style: '',
      label: $t('specialization.course_tag'),
      icon: TrendingUpIcon
    }
  };

  let cost = $derived(calcCourseDiscount(pricingData.discount, pricingData.cost ?? 0, !!pricingData.showDiscount));

  let courseUrl = $derived(
    href ?? (isOnLandingPage || isExplore ? `/course/${slug}` : `/courses/${id}${isLMS ? '/lessons?next=true' : ''}`)
  );

  const typeBadge = $derived(
    type && COURSE_TAG[type]
      ? {
          label: COURSE_TAG[type].label,
          icon: COURSE_TAG[type].icon,
          iconClass: COURSE_TAG[type].iconStyle
        }
      : undefined
  );
</script>

<CourseCard href={resolve(courseUrl, {})} {title} {description} {typeBadge} class="group relative">
  {#snippet media()}
    <Image src={bannerImage} alt="Course banner image" className="w-full h-full rounded-sm object-cover" />
  {/snippet}

  {#snippet overlay()}
    {#if actions}
      {@render actions()}
    {:else if !isLMS && !isOnLandingPage}
      <CardDropdown {id} {title} {description} />
    {/if}
  {/snippet}

  {#snippet tags()}
    {#if !isLMS}
      <CourseTagsOverflow tags={courseTags} variant="card" />
    {/if}
  {/snippet}

  {#snippet footer()}
    <div class="flex justify-between {isLMS && 'items-center'} w-full">
      <div class="w-[60%]">
        {#if isLMS || isOnLandingPage}
          <p class="text-xs {!isLMS && 'pl-2'} flex gap-1 dark:text-white">
            <span>
              {totalLessons}
              {$t('courses.course_card.lessons_number')}
            </span>
            &
            <span>
              {pluralize($t('courses.course_card.exercise'), totalExercises, true)}
            </span>
          </p>
        {/if}
        <div class="py-2 text-xs">
          {#if isOnLandingPage}
            <span class="px-2">
              {#if !cost}
                {$t('course.navItem.landing_page.pricing_section.free')}
              {:else if pricingData.showDiscount}
                {formatter.format(cost)}
                <span class="line-through">
                  {formatter?.format(pricingData?.cost ?? 0)}
                </span>
              {:else}
                {formatter.format(cost)}
              {/if}
            </span>
          {:else if isLMS}
            {#if !isExplore}
              <div class="flex w-3/4 items-center gap-2">
                <Progress value={progressRate} />
                <p class="ui:text-muted-foreground text-xs">{progressRate}%</p>
              </div>
            {/if}
          {:else}
            <CoursePublishBadge {isPublished} />
          {/if}
        </div>
      </div>

      {#if isLMS}
        <Button variant="outline">
          {isExplore ? $t('courses.course_card.learn_more') : $t('courses.course_card.continue_course')}

          <ArrowRightIcon class="custom" />
        </Button>
      {:else if !isOnLandingPage}
        <div class="flex flex-col justify-end gap-1 text-right">
          <p class="pl-2 text-xs whitespace-nowrap dark:text-white">
            <span>
              {totalLessons}
              {$t('courses.course_card.lessons_number')}
            </span>
            &
            <span>
              {pluralize($t('courses.course_card.exercise'), totalExercises, true)}
            </span>
          </p>
          <p class="pl-2 text-xs dark:text-white">
            {pluralize($t('courses.course_card.students'), totalStudents, true)}
          </p>
        </div>
      {/if}
    </div>
  {/snippet}
</CourseCard>
