<script lang="ts">
  import { goto } from '$app/navigation';
  import { Badge } from '@cio/ui/base/badge';
  import UserIcon from '@lucide/svelte/icons/user';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import CircleDotIcon from '@lucide/svelte/icons/circle-dot';
  import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';

  import ImageRenderer from '$lib/components/Org/ImageRenderer.svelte';
  import { Button } from '@cio/ui/base/button';

  import { COURSE_TYPE } from '$lib/utils/types';
  import { t } from '$lib/utils/functions/translations';
  import { calcCourseDiscount } from '$lib/utils/functions/course';
  import getCurrencyFormatter from '$lib/utils/functions/getCurrencyFormatter';
  import { copyCourseModal, deleteCourseModal } from '$lib/features/course/utils/store';

  interface Props {
    bannerImage: string | undefined;
    id?: string;
    slug?: string;
    title?: string;
    description?: string;
    isPublished?: boolean;
    totalLessons?: number;
    totalStudents?: number;
    currency?: string;
    isOnLandingPage?: boolean;
    isLMS?: boolean;
    isExplore?: boolean;
    progressRate?: number;
    type: COURSE_TYPE;
    pricingData?: {
      cost: number;
      currency?: string;
      showDiscount?: boolean;
      discount?: number;
    };
  }

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
    isOnLandingPage = false,
    isLMS = false,
    isExplore = false,
    progressRate = 45,
    type,
    pricingData = {
      cost: 0
    }
  }: Props = $props();

  let formatter = $derived(getCurrencyFormatter(currency));

  function handleCloneCourse() {
    $copyCourseModal.open = true;
    $copyCourseModal.id = id;
    $copyCourseModal.title = title;
    $copyCourseModal.description = description;
  }

  function handleShareCourse() {
    goto(`/courses/${id}/settings#share`);
  }

  function handleInvite() {
    goto(`/courses/${id}/people?add=true`);
  }

  function handleDeleteCourse() {
    $deleteCourseModal.open = true;
    $deleteCourseModal.id = id;
    $deleteCourseModal.title = title;
  }

  const COURSE_TAG: Record<
    string,
    {
      style: string;
      label: string;
      icon: any;
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
      iconStyle: 'custom text-primary-700'
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

<div
  role="button"
  tabindex="0"
  onclick={() => {
    goto(courseUrl);
  }}
  onkeydown={(e) => {
    if (e.key === 'Enter') {
      goto(courseUrl);
    }
  }}
  class="border-gray group relative w-full max-w-[320px] rounded border text-black dark:border-neutral-600"
>
  <div class="p-4">
    <div class="relative mb-5">
      {#if !isLMS && !isOnLandingPage}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger
            class="absolute right-2 top-2 z-40 flex items-center justify-center rounded-full bg-gray-200 p-2 opacity-0 transition-all delay-150 duration-200 ease-in-out group-hover:opacity-100 dark:bg-neutral-800"
            onclick={(e) => e.stopPropagation()}
          >
            <EllipsisVerticalIcon size={16} />
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end">
            <DropdownMenu.Item onclick={handleCloneCourse}>
              {$t('courses.course_card.context_menu.clone')}
            </DropdownMenu.Item>
            <DropdownMenu.Item onclick={handleShareCourse}>
              {$t('courses.course_card.context_menu.share')}
            </DropdownMenu.Item>
            <DropdownMenu.Item onclick={handleInvite}>
              {$t('courses.course_card.context_menu.invite')}
            </DropdownMenu.Item>
            <DropdownMenu.Separator />
            <DropdownMenu.Item class="text-red-600" onclick={handleDeleteCourse}>
              {$t('courses.course_card.context_menu.delete')}
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      {/if}

      <ImageRenderer
        src={bannerImage}
        alt="Banner Image"
        className="relative h-[200px] w-full rounded dark:border dark:border-neutral-600"
      />

      {#if type}
        {@const tag = COURSE_TAG[type]}
        <span
          class="bg-primary-50 absolute bottom-2 left-2 z-10 flex items-center gap-1 rounded-sm p-1 font-mono text-xs capitalize"
        >
          <tag.icon class={tag.iconStyle} />
          {tag.label}
        </span>
      {/if}
    </div>

    <h3 class="title text-xl dark:text-white">{title}</h3>
    <p class="description mt-2 text-sm text-gray-500 dark:text-gray-300">
      {description}
    </p>
  </div>

  <div
    class="border-gray flex justify-between border border-b-0 border-l-0 border-r-0 px-4 py-2 dark:border-neutral-600 {isLMS &&
      'items-center'}"
  >
    <div>
      <p class="text-xs {!isLMS && 'pl-2'} dark:text-white">
        {totalLessons}
        {$t('courses.course_card.lessons_number')}
      </p>
      <p class="py-2 text-xs">
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
            <div class="flex items-center gap-2">
              <div class=" relative h-1 w-[50px] bg-[#EAEAEA]">
                <div style="width:{progressRate}%" class="bg-primary-700 absolute left-0 top-0 h-full"></div>
              </div>
              <p class="text-xs text-[#656565] dark:text-white">{progressRate}%</p>
            </div>
          {/if}
        {:else}
          <Badge variant={isPublished ? 'default' : 'secondary'}>
            {#if isPublished}
              {$t('courses.course_card.published')}
            {:else}
              {$t('courses.course_card.unpublished')}
            {/if}
          </Badge>
        {/if}
      </p>
    </div>

    {#if isLMS}
      <Button variant="outline">
        {isExplore ? $t('courses.course_card.learn_more') : $t('courses.course_card.continue_course')}
      </Button>
    {:else if !isOnLandingPage}
      <div class="flex flex-col justify-between">
        <p class="pl-2 text-xs dark:text-white">
          {totalStudents}
          {$t('courses.course_card.students')}
        </p>
        <div></div>
      </div>
    {/if}
  </div>
</div>

<style>
  .title,
  .description {
    height: 42px;
    line-height: 20px;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -moz-box-orient: vertical;
    -ms-box-orient: vertical;
    box-orient: vertical;
    -webkit-line-clamp: 2;
    -moz-line-clamp: 2;
    -ms-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
  }
</style>
