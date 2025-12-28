<script lang="ts">
  import type { Component } from 'svelte';
  import { resolve } from '$app/paths';
  import { Badge } from '@cio/ui/base/badge';
  import UserIcon from '@lucide/svelte/icons/user';
  import CircleDotIcon from '@lucide/svelte/icons/circle-dot';
  import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';

  import { Button } from '@cio/ui/base/button';
  import { Separator } from '@cio/ui/base/separator';
  import * as Item from '@cio/ui/base/item';
  import { Progress } from '@cio/ui/base/progress';

  import { Image } from '$features/ui';
  import { COURSE_TYPE } from '$lib/utils/types';
  import { t } from '$lib/utils/functions/translations';
  import { calcCourseDiscount } from '$lib/utils/functions/course';
  import getCurrencyFormatter from '$lib/utils/functions/getCurrencyFormatter';
  import { calcProgressRate } from '$features/course/utils/functions';
  import CardDropdown from './card-dropdown.svelte';
  import type { OrgCourses, UserEnrolledCourses } from '$features/course/types';

  export interface Props {
    course: OrgCourses[number] | UserEnrolledCourses[number];
    isOnLandingPage?: boolean;
    isLMS?: boolean;
    isExplore?: boolean;
  }

  let { course, isOnLandingPage, isLMS, isExplore }: Props = $props();

  let {
    bannerImage,
    id = '',
    slug = '',
    title = '',
    description = '',
    isPublished = false,
    totalLessons = 0,
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
    bannerImage: course.logo || '/images/classroomio-course-img-template.jpg',
    title: course.title,
    type: course.type,
    description: course.description,
    isPublished: course.isPublished,
    pricingData: {
      cost: course.cost,
      discount: course.metadata?.discount || 0,
      showDiscount: course.metadata?.showDiscount || false
    },
    currency: course.currency,
    totalLessons: course.lessonCount,
    progressRate: calcProgressRate(('progressRate' in course ? course.progressRate : 0), course.lessonCount),
    totalStudents: ('totalStudents' in course ? course.totalStudents : 0)
  });

  let formatter = $derived(getCurrencyFormatter(currency));

  const COURSE_TAG: Record<
    string,
    {
      style: string;
      label: string;
      icon: Component;
      iconStyle?: string;
    }
  > = {
    [COURSE_TYPE.LIVE_CLASS]: {
      style: '',
      label: $t('course.navItem.settings.live_class'),
      icon: CircleDotIcon,
      iconStyle: 'custom text-red-700'
    },
    [COURSE_TYPE.SELF_PACED]: {
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
    isOnLandingPage || isExplore ? `/course/${slug}` : `/courses/${id}${isLMS ? '/lessons?next=true' : ''}`
  );
</script>

<Item.Root variant="outline" class="p-3! group relative max-w-[320px]">
  {#snippet child({ props })}
    <a href={resolve(courseUrl, {})} {...props}>
      {#if !isLMS && !isOnLandingPage}
        <CardDropdown {id} {title} {description} />
      {/if}

      <Item.Header>
        <Item.Media variant="image" class="h-50! w-full! relative">
          <Image src={bannerImage} alt="Course banner image" className="w-full h-full rounded-sm object-cover" />

          {#if type}
            {@const tag = COURSE_TAG[type]}
            <Badge class="rounded-md! absolute bottom-2 left-2 z-10 flex items-center capitalize" variant="secondary">
              <tag.icon class={tag.iconStyle} />
              {tag.label}
            </Badge>
          {/if}
        </Item.Media>
      </Item.Header>

      <Item.Content>
        <Item.Title class="text-base! line-clamp-1 min-h-[44px]">
          {title}
        </Item.Title>

        <Item.Description class="min-h-[63px]">{description}</Item.Description>

        <Separator class="my-3" />

        <div class="flex justify-between {isLMS && 'items-center'} w-full">
          <div class="w-[50%]">
            <p class="text-xs {!isLMS && 'pl-2'} dark:text-white">
              {totalLessons}
              {$t('courses.course_card.lessons_number')}
            </p>
            <div class="py-2 text-xs">
              {#if isOnLandingPage}
                <span class="px-2">
                  {#if !cost}
                    {$t('course.navItem.landing_page.pricing_section.free')}
                  {:else if pricingData.showDiscount}
                    {formatter.format(cost)}
                    <span class="line-through">
                      {formatter?.format(pricingData?.cost)}
                    </span>
                  {:else}
                    {formatter.format(cost)}
                  {/if}
                </span>
              {:else if isLMS}
                {#if !isExplore}
                  <div class="flex w-3/4 items-center gap-2">
                    <Progress value={50} />
                    <p class="ui:text-muted-foreground text-xs">{progressRate}%</p>
                  </div>
                {/if}
              {:else}
                <Badge variant={isPublished ? 'default' : 'outline'}>
                  {#if isPublished}
                    {$t('courses.course_card.published')}
                  {:else}
                    {$t('courses.course_card.unpublished')}
                  {/if}
                </Badge>
              {/if}
            </div>
          </div>

          {#if isLMS}
            <Button variant="outline">
              {isExplore ? $t('courses.course_card.learn_more') : $t('courses.course_card.continue_course')}

              <ArrowRightIcon class="custom" />
            </Button>
          {:else if !isOnLandingPage}
            <div class="flex flex-col justify-between">
              <p class="pl-2 text-xs dark:text-white">
                {totalStudents}
                {$t('courses.course_card.students')}
              </p>
            </div>
          {/if}
        </div>
      </Item.Content>
    </a>
  {/snippet}
</Item.Root>
