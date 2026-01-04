<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import Plus from '@lucide/svelte/icons/plus';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import LockIcon from '@lucide/svelte/icons/lock';
  import * as Collapsible from '@cio/ui/base/collapsible';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import { Button } from '@cio/ui/base/button';
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';

  import TableOfContentsIcon from '@lucide/svelte/icons/table-of-contents';
  import {
    HoverableItem,
    NewsFeedIcon,
    LessonIcon,
    AnalyticsIcon,
    AttendanceIcon,
    SubmissionIcon,
    MarksIcon,
    CertificateIcon,
    LandingPageIcon,
    PeopleIcon,
    SettingsIcon
  } from '@cio/ui/custom/moving-icons';

  import { NAV_IDS } from './constants';
  import { profile } from '$lib/utils/store/user';
  import { courseApi } from '$features/course/api';
  import { t } from '$lib/utils/functions/translations';
  import { handleAddLessonWidget } from '$features/course/components/lesson/store';
  import { getIsLessonComplete } from '$features/course/components/lesson/functions';
  import { currentOrg, isFreePlan, currentOrgPath } from '$lib/utils/store/org';
  import { globalStore } from '$lib/utils/store/app';
  import { getNavItemRoute, getLessonsRoute, getLectureNo } from '$features/course/utils/functions';
  import { lessonApi } from '$features/course/api';

  import { Chip } from '@cio/ui/custom/chip';
  import { CircleCheckIcon } from '$features/ui/icons';

  interface Props {
    path: string;
    id: string;
    isStudent?: boolean;
  }

  let { path, id, isStudent = false }: Props = $props();

  $effect(() => {
    console.log('course id', id);
  });

  const coursesListPath = $derived($globalStore.isOrgSite ? '/lms/mylearning' : `${$currentOrgPath}/courses`);

  const navItems = $derived(
    [
      {
        id: NAV_IDS.NEWS_FEED,
        title: $t('course.navItems.nav_news_feed'),
        url: getNavItemRoute(id),
        isActive: (path || page.url.pathname) === getNavItemRoute(id),
        show() {
          return isStudent ? $currentOrg.customization?.['course']?.['newsfeed'] : true;
        },
        icon: getNavIcon(NAV_IDS.NEWS_FEED)
      },
      {
        id: NAV_IDS.LESSONS,
        title: $t('course.navItems.nav_content'),
        url: getLessonsRoute(id),
        isActive:
          (path || page.url.pathname).includes('/lessons') || (path || page.url.pathname) === getLessonsRoute(id),
        isLesson: true,
        icon: getNavIcon(NAV_IDS.LESSONS),
        items:
          courseApi.course?.version === 'V1'
            ? (lessonApi.lessons || []).map((lesson, index) => ({
                title: lesson.title,
                url: getLessonsRoute(id, lesson.id),
                lesson,
                index,
                isV1: true
              }))
            : lessonApi.sections.flatMap((section) =>
                section.lessons.map((lesson) => ({
                  title: lesson.title,
                  url: getLessonsRoute(id, lesson.id),
                  lesson,
                  sectionTitle: section.title,
                  isV1: false
                }))
              )
      },
      {
        id: NAV_IDS.ANALYTICS,
        title: $t('course.navItems.nav_analytics'),
        url: getNavItemRoute(id, 'analytics'),
        isActive: (path || page.url.pathname) === getNavItemRoute(id, 'analytics'),
        show() {
          return !isStudent;
        },
        icon: getNavIcon(NAV_IDS.ANALYTICS)
      },
      {
        id: NAV_IDS.ATTENDANCE,
        title: $t('course.navItems.nav_attendance'),
        url: getNavItemRoute(id, 'attendance'),
        isActive: (path || page.url.pathname) === getNavItemRoute(id, 'attendance'),
        show() {
          if (courseApi.course?.type !== 'LIVE_CLASS') return false;
          return true;
        },
        icon: getNavIcon(NAV_IDS.ATTENDANCE)
      },
      {
        id: NAV_IDS.SUBMISSIONS,
        title: $t('course.navItems.nav_submissions'),
        url: getNavItemRoute(id, 'submissions'),
        isActive: (path || page.url.pathname) === getNavItemRoute(id, 'submissions'),
        show() {
          if (isStudent) return false;
          return true;
        },
        icon: getNavIcon(NAV_IDS.SUBMISSIONS)
      },
      {
        id: NAV_IDS.MARKS,
        title: $t('course.navItems.nav_marks'),
        url: getNavItemRoute(id, 'marks'),
        isActive: (path || page.url.pathname) === getNavItemRoute(id, 'marks'),
        show() {
          if (courseApi.course?.type === 'LIVE_CLASS') {
            return isStudent ? ($currentOrg.customization?.['course']?.['grading'] ?? false) : true;
          }
          return false;
        },
        icon: getNavIcon(NAV_IDS.MARKS)
      },
      {
        id: NAV_IDS.CERTIFICATES,
        title: $t('course.navItems.nav_certificates'),
        url: getNavItemRoute(id, 'certificates'),
        isActive: (path || page.url.pathname) === getNavItemRoute(id, 'certificates'),
        show() {
          if (isStudent && $isFreePlan) {
            return false;
          }
          return true;
        },
        icon: getNavIcon(NAV_IDS.CERTIFICATES)
      },
      {
        id: NAV_IDS.LANDING_PAGE,
        title: $t('course.navItems.nav_landing_page'),
        url: getNavItemRoute(id, 'landingpage'),
        isActive: (path || page.url.pathname) === getNavItemRoute(id, 'landingpage'),
        show() {
          return !isStudent;
        },
        icon: getNavIcon(NAV_IDS.LANDING_PAGE)
      },
      {
        id: NAV_IDS.PEOPLE,
        title: $t('course.navItems.nav_people'),
        url: getNavItemRoute(id, 'people'),
        isActive: (path || page.url.pathname) === getNavItemRoute(id, 'people'),
        show() {
          return !isStudent;
        },
        icon: getNavIcon(NAV_IDS.PEOPLE)
      },
      {
        id: NAV_IDS.SETTINGS,
        title: $t('course.navItems.nav_settings'),
        url: getNavItemRoute(id, 'settings'),
        isActive: (path || page.url.pathname) === getNavItemRoute(id, 'settings'),
        show() {
          return !isStudent;
        },
        icon: getNavIcon(NAV_IDS.SETTINGS)
      }
    ].filter((item) => !item.show || item.show())
  );

  function addLesson(isSection: boolean, id: string) {
    goto('/courses/' + id + '/lessons');
    $handleAddLessonWidget.open = true;

    if (courseApi.course?.version === 'V2') {
      $handleAddLessonWidget.isSection = isSection ? false : true;

      if (isSection) {
        $handleAddLessonWidget.id = id;
      }
    }
  }

  function getNavIcon(id: string) {
    if (!id) return null;

    if (id === NAV_IDS.SECTION) {
      return TableOfContentsIcon;
    } else if (id === NAV_IDS.NEWS_FEED) {
      return NewsFeedIcon;
    } else if (id === NAV_IDS.LESSONS) {
      return LessonIcon;
    } else if (id === NAV_IDS.ATTENDANCE) {
      return AttendanceIcon;
    } else if (id === NAV_IDS.SUBMISSIONS) {
      return SubmissionIcon;
    } else if (id === NAV_IDS.MARKS) {
      return MarksIcon;
    } else if (id === NAV_IDS.PEOPLE) {
      return PeopleIcon;
    } else if (id === NAV_IDS.ANALYTICS) {
      return AnalyticsIcon;
    } else if (id === NAV_IDS.LANDING_PAGE) {
      return LandingPageIcon;
    } else if (id === NAV_IDS.CERTIFICATES) {
      return CertificateIcon;
    } else if (id === NAV_IDS.SETTINGS) {
      return SettingsIcon;
    }

    return null;
  }
</script>

<Sidebar.Group class="pt-0!">
  <Button variant="link" class="h-fit! justify-start! px-2! py-2!" href={coursesListPath}>
    <ArrowLeftIcon class="custom" />
    <span class="text-xs">Courses</span>
  </Button>

  <Sidebar.Menu>
    {#each navItems as item (item.id)}
      <Collapsible.Root open={item.isActive} class="group/collapsible">
        {#snippet child({ props })}
          <Sidebar.MenuItem {...props}>
            {#if item.isLesson && item.items}
              <Collapsible.Trigger>
                {#snippet child({ props })}
                  <a href={item.url}>
                    <Sidebar.MenuButton {...props} tooltipContent={item.title}>
                      {#snippet child({ props })}
                        <HoverableItem {...props} class="flex w-full items-center gap-4 py-2 pl-1.5 {props.class}">
                          {#snippet children(isHovered)}
                            {@const Icon = item.icon}
                            {#if Icon === TableOfContentsIcon}
                              <Icon size={16} />
                            {:else}
                              <Icon {isHovered} size={16} />
                            {/if}
                            <span>{item.title}</span>

                            <div class="ml-auto flex items-center gap-1">
                              <Plus size={20} class="rounded-full p-1" onclick={() => addLesson(false, item.id)} />

                              <ChevronRightIcon
                                size={20}
                                class="rounded-full p-1 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                              />
                            </div>
                          {/snippet}
                        </HoverableItem>
                      {/snippet}
                    </Sidebar.MenuButton>
                  </a>
                {/snippet}
              </Collapsible.Trigger>
              <Collapsible.Content>
                <Sidebar.MenuSub>
                  {#if courseApi.course?.version === 'V1'}
                    {#each item.items as lessonItem}
                      <Sidebar.MenuSubItem>
                        <Sidebar.MenuSubButton isActive={(path || page.url.pathname).includes(lessonItem.lesson.id)}>
                          {#snippet child({ props })}
                            <a
                              href={isStudent && !lessonItem.lesson.isUnlocked ? page.url.pathname : lessonItem.url}
                              aria-disabled={!lessonItem.lesson.isUnlocked}
                              title={lessonItem.lesson.title}
                              class="flex w-full items-center gap-2 {isStudent && !lessonItem.lesson.isUnlocked
                                ? 'cursor-not-allowed opacity-50'
                                : ''}"
                              {...props}
                            >
                              {#if lessonItem.isV1 && 'index' in lessonItem}
                                <Chip value={getLectureNo(lessonItem.index + 1)} />
                              {/if}
                              <span class="flex-1 truncate">{lessonItem.lesson.title}</span>
                              {#if !lessonItem.lesson.isUnlocked}
                                <LockIcon size={16} class="shrink-0" />
                              {:else if getIsLessonComplete(lessonItem.lesson.lesson_completion, $profile.id)}
                                <span class="shrink-0">
                                  <CircleCheckIcon size={16} filled />
                                </span>
                              {/if}
                            </a>
                          {/snippet}
                        </Sidebar.MenuSubButton>
                      </Sidebar.MenuSubItem>
                    {/each}
                  {:else}
                    {#each lessonApi.sections as section}
                      <Collapsible.Root open={true} class="group/section">
                        {#snippet child({ props })}
                          <Sidebar.MenuSubItem {...props}>
                            <Collapsible.Trigger>
                              {#snippet child({ props })}
                                <Sidebar.MenuSubButton {...props} class="flex w-full items-center gap-2 font-medium">
                                  {@const Icon = getNavIcon(NAV_IDS.SECTION)}

                                  <Icon size={14} />

                                  <span class="flex-1 truncate">{section.title}</span>
                                  <div class="ml-auto flex items-center gap-1">
                                    <Plus
                                      size={20}
                                      class="rounded-full p-1 hover:bg-gray-200"
                                      onclick={() => addLesson(true, section.id)}
                                    />

                                    <ChevronRightIcon
                                      size={20}
                                      class="rounded-full p-1 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 hover:bg-gray-200"
                                    />
                                  </div>
                                </Sidebar.MenuSubButton>
                              {/snippet}
                            </Collapsible.Trigger>
                            <Collapsible.Content>
                              <Sidebar.MenuSub class="ml-2">
                                {#each section.lessons as lesson}
                                  <Sidebar.MenuSubItem>
                                    <Sidebar.MenuSubButton isActive={(path || page.url.pathname).includes(lesson.id)}>
                                      {#snippet child({ props })}
                                        <a
                                          href={isStudent && !lesson.isUnlocked
                                            ? page.url.pathname
                                            : getLessonsRoute(id, lesson.id)}
                                          aria-disabled={!lesson.isUnlocked}
                                          title={lesson.title}
                                          class="flex w-full items-center gap-2 {isStudent && !lesson.isUnlocked
                                            ? 'cursor-not-allowed opacity-50'
                                            : ''}"
                                          {...props}
                                        >
                                          <span class="flex-1 truncate">{lesson.title}</span>
                                          {#if !lesson.isUnlocked}
                                            <LockIcon size={16} class="shrink-0" />
                                          {:else if getIsLessonComplete(lesson.lesson_completion, $profile.id)}
                                            <span class="shrink-0">
                                              <CircleCheckIcon size={16} filled />
                                            </span>
                                          {/if}
                                        </a>
                                      {/snippet}
                                    </Sidebar.MenuSubButton>
                                  </Sidebar.MenuSubItem>
                                {/each}
                              </Sidebar.MenuSub>
                            </Collapsible.Content>
                          </Sidebar.MenuSubItem>
                        {/snippet}
                      </Collapsible.Root>
                    {/each}
                  {/if}
                </Sidebar.MenuSub>
              </Collapsible.Content>
            {:else}
              <a href={item.url}>
                <Sidebar.MenuButton
                  tooltipContent={item.title}
                  class="flex w-full cursor-pointer items-center gap-4 px-1.5 py-2 {item.isActive
                    ? 'ui:bg-accent ui:text-accent-foreground'
                    : ''}"
                >
                  {#snippet child({ props })}
                    <HoverableItem {...props}>
                      {#snippet children(isHovered)}
                        {@const Icon = item.icon}
                        {#if Icon === TableOfContentsIcon}
                          <Icon size={16} />
                        {:else}
                          <Icon {isHovered} size={16} />
                        {/if}
                        <span>{item.title}</span>
                      {/snippet}
                    </HoverableItem>
                  {/snippet}
                </Sidebar.MenuButton>
              </a>
            {/if}
          </Sidebar.MenuItem>
        {/snippet}
      </Collapsible.Root>
    {/each}
  </Sidebar.Menu>
</Sidebar.Group>

<style>
  a {
    text-decoration: none;
  }
</style>
