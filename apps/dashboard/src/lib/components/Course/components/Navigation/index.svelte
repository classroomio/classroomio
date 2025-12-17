<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import Plus from '@lucide/svelte/icons/plus';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import LockIcon from '@lucide/svelte/icons/lock';
  import * as Collapsible from '@cio/ui/base/collapsible';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

  import UsersIcon from '@lucide/svelte/icons/users';
  import AwardIcon from '@lucide/svelte/icons/award';
  import PanelTop from '@lucide/svelte/icons/panel-top';
  import SettingsIcon from '@lucide/svelte/icons/settings';
  import MegaphoneIcon from '@lucide/svelte/icons/megaphone';
  import ChartLineIcon from '@lucide/svelte/icons/chart-line';
  import BookCheckIcon from '@lucide/svelte/icons/book-check';
  import ScrollTextIcon from '@lucide/svelte/icons/scroll-text';
  import SquareLibrary from '@lucide/svelte/icons/square-library';
  import BookOpenCheck from '@lucide/svelte/icons/book-open-check';
  import TableOfContentsIcon from '@lucide/svelte/icons/table-of-contents';

  import { NAV_IDS } from './constants';
  import { profile } from '$lib/utils/store/user';
  import { course } from '$lib/components/Course/store';
  import { t } from '$lib/utils/functions/translations';
  import { handleAddLessonWidget } from '../Lesson/store';
  import { getIsLessonComplete } from '../Lesson/functions';
  import { currentOrg, isFreePlan } from '$lib/utils/store/org';
  import { COURSE_TYPE, COURSE_VERSION } from '$lib/utils/types';
  import { lessons, lessonSections } from '../Lesson/store/lessons';
  import { getNavItemRoute, getLessonsRoute, getLectureNo } from '$lib/components/Course/function';

  import { Chip } from '@cio/ui/custom/chip';
  import { CircleCheckIcon } from '$features/ui/icons';

  interface Props {
    path: string;
    isStudent?: boolean;
  }

  let { path, isStudent = false }: Props = $props();

  const navItems = $derived(
    [
      {
        id: NAV_IDS.NEWS_FEED,
        title: $t('course.navItems.nav_news_feed'),
        url: getNavItemRoute($course.id),
        isActive: (path || page.url.pathname) === getNavItemRoute($course.id),
        show() {
          return isStudent ? $currentOrg.customization?.['course']?.['newsfeed'] : true;
        },
        icon: getNavIcon(NAV_IDS.NEWS_FEED)
      },
      {
        id: NAV_IDS.LESSONS,
        title: $t('course.navItems.nav_content'),
        url: getLessonsRoute($course.id),
        isActive:
          (path || page.url.pathname).includes('/lessons') ||
          (path || page.url.pathname) === getLessonsRoute($course.id),
        isLesson: true,
        icon: getNavIcon(NAV_IDS.LESSONS),
        items:
          $course.version === COURSE_VERSION.V1
            ? ($lessons || []).map((lesson, index) => ({
                title: lesson.title,
                url: getLessonsRoute($course.id, lesson.id),
                lesson,
                index,
                isV1: true
              }))
            : $lessonSections.flatMap((section) =>
                section.lessons.map((lesson) => ({
                  title: lesson.title,
                  url: getLessonsRoute($course.id, lesson.id),
                  lesson,
                  sectionTitle: section.title,
                  isV1: false
                }))
              )
      },
      {
        id: NAV_IDS.ANALYTICS,
        title: $t('course.navItems.nav_analytics'),
        url: getNavItemRoute($course.id, 'analytics'),
        isActive: (path || page.url.pathname) === getNavItemRoute($course.id, 'analytics'),
        show() {
          return !isStudent;
        },
        icon: getNavIcon(NAV_IDS.ANALYTICS)
      },
      {
        id: NAV_IDS.ATTENDANCE,
        title: $t('course.navItems.nav_attendance'),
        url: getNavItemRoute($course.id, 'attendance'),
        isActive: (path || page.url.pathname) === getNavItemRoute($course.id, 'attendance'),
        show() {
          if ($course.type !== COURSE_TYPE.LIVE_CLASS) return false;
          return true;
        },
        icon: getNavIcon(NAV_IDS.ATTENDANCE)
      },
      {
        id: NAV_IDS.SUBMISSIONS,
        title: $t('course.navItems.nav_submissions'),
        url: getNavItemRoute($course.id, 'submissions'),
        isActive: (path || page.url.pathname) === getNavItemRoute($course.id, 'submissions'),
        show() {
          if (isStudent) return false;
          return true;
        },
        icon: getNavIcon(NAV_IDS.SUBMISSIONS)
      },
      {
        id: NAV_IDS.MARKS,
        title: $t('course.navItems.nav_marks'),
        url: getNavItemRoute($course.id, 'marks'),
        isActive: (path || page.url.pathname) === getNavItemRoute($course.id, 'marks'),
        show() {
          if ($course.type == COURSE_TYPE.LIVE_CLASS) {
            return isStudent ? ($currentOrg.customization?.['course']?.['grading'] ?? false) : true;
          }
          return false;
        },
        icon: getNavIcon(NAV_IDS.MARKS)
      },
      {
        id: NAV_IDS.CERTIFICATES,
        title: $t('course.navItems.nav_certificates'),
        url: getNavItemRoute($course.id, 'certificates'),
        isActive: (path || page.url.pathname) === getNavItemRoute($course.id, 'certificates'),
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
        url: getNavItemRoute($course.id, 'landingpage'),
        isActive: (path || page.url.pathname) === getNavItemRoute($course.id, 'landingpage'),
        show() {
          return !isStudent;
        },
        icon: getNavIcon(NAV_IDS.LANDING_PAGE)
      },
      {
        id: NAV_IDS.PEOPLE,
        title: $t('course.navItems.nav_people'),
        url: getNavItemRoute($course.id, 'people'),
        isActive: (path || page.url.pathname) === getNavItemRoute($course.id, 'people'),
        show() {
          return !isStudent;
        },
        icon: getNavIcon(NAV_IDS.PEOPLE)
      },
      {
        id: NAV_IDS.SETTINGS,
        title: $t('course.navItems.nav_settings'),
        url: getNavItemRoute($course.id, 'settings'),
        isActive: (path || page.url.pathname) === getNavItemRoute($course.id, 'settings'),
        show() {
          return !isStudent;
        },
        icon: getNavIcon(NAV_IDS.SETTINGS)
      }
    ].filter((item) => !item.show || item.show())
  );

  function addLesson(isSection: boolean, id: string) {
    goto('/courses/' + $course.id + '/lessons');
    $handleAddLessonWidget.open = true;

    if ($course.version === COURSE_VERSION.V2) {
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
      return MegaphoneIcon;
    } else if (id === NAV_IDS.LESSONS) {
      return ScrollTextIcon;
    } else if (id === NAV_IDS.ATTENDANCE) {
      return BookOpenCheck;
    } else if (id === NAV_IDS.SUBMISSIONS) {
      return SquareLibrary;
    } else if (id === NAV_IDS.MARKS) {
      return BookCheckIcon;
    } else if (id === NAV_IDS.PEOPLE) {
      return UsersIcon;
    } else if (id === NAV_IDS.ANALYTICS) {
      return ChartLineIcon;
    } else if (id === NAV_IDS.LANDING_PAGE) {
      return PanelTop;
    } else if (id === NAV_IDS.CERTIFICATES) {
      return AwardIcon;
    } else if (id === NAV_IDS.SETTINGS) {
      return SettingsIcon;
    }

    return null;
  }

  function toggleSidebarOnMobile() {}
</script>

<Sidebar.Group>
  <Sidebar.GroupLabel>Course Navigation</Sidebar.GroupLabel>
  <Sidebar.Menu>
    {#each navItems as item (item.id)}
      <Collapsible.Root open={item.isActive} class="group/collapsible">
        {#snippet child({ props })}
          <Sidebar.MenuItem {...props}>
            {#if item.isLesson && item.items}
              <Collapsible.Trigger>
                {#snippet child({ props })}
                  <a href={item.url}>
                    <Sidebar.MenuButton
                      {...props}
                      tooltipContent={item.title}
                      class="flex w-full items-center gap-4 py-2 pl-1.5"
                    >
                      {@const Icon = item.icon}
                      <Icon size={16} class="nav-icon group-hover:animate-{item.id}" />
                      {item.title}

                      <div class="ml-auto flex items-center gap-1">
                        <Plus
                          size={20}
                          class="rounded-full p-1 hover:bg-gray-200"
                          onclick={() => addLesson(false, item.id)}
                        />

                        <ChevronRightIcon
                          size={20}
                          class="rounded-full p-1 transition-transform duration-200 hover:bg-gray-200 group-data-[state=open]/collapsible:rotate-90"
                        />
                      </div>
                    </Sidebar.MenuButton>
                  </a>
                {/snippet}
              </Collapsible.Trigger>
              <Collapsible.Content>
                <Sidebar.MenuSub>
                  {#if $course.version === COURSE_VERSION.V1}
                    {#each item.items as lessonItem}
                      <Sidebar.MenuSubItem>
                        <Sidebar.MenuSubButton isActive={(path || page.url.pathname).includes(lessonItem.lesson.id)}>
                          {#snippet child({ props })}
                            <a
                              href={isStudent && !lessonItem.lesson.is_unlocked ? page.url.pathname : lessonItem.url}
                              onclick={toggleSidebarOnMobile}
                              aria-disabled={!lessonItem.lesson.is_unlocked}
                              title={lessonItem.lesson.title}
                              class="flex w-full items-center gap-2 {isStudent && !lessonItem.lesson.is_unlocked
                                ? 'cursor-not-allowed opacity-50'
                                : ''}"
                              {...props}
                            >
                              {#if lessonItem.isV1 && 'index' in lessonItem}
                                <Chip value={getLectureNo(lessonItem.index + 1)} />
                              {/if}
                              <span class="flex-1 truncate">{lessonItem.lesson.title}</span>
                              {#if !lessonItem.lesson.is_unlocked}
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
                    {#each $lessonSections as section}
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
                                      class="rounded-full p-1 transition-transform duration-200 hover:bg-gray-200 group-data-[state=open]/collapsible:rotate-90"
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
                                          href={isStudent && !lesson.is_unlocked
                                            ? page.url.pathname
                                            : getLessonsRoute($course.id, lesson.id)}
                                          onclick={toggleSidebarOnMobile}
                                          aria-disabled={!lesson.is_unlocked}
                                          title={lesson.title}
                                          class="flex w-full items-center gap-2 {isStudent && !lesson.is_unlocked
                                            ? 'cursor-not-allowed opacity-50'
                                            : ''}"
                                          {...props}
                                        >
                                          <span class="flex-1 truncate">{lesson.title}</span>
                                          {#if !lesson.is_unlocked}
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
              <a href={item.url} onclick={toggleSidebarOnMobile}>
                <Sidebar.MenuButton
                  tooltipContent={item.title}
                  class="flex w-full cursor-pointer items-center gap-4 px-1.5 py-2 {item.isActive
                    ? 'ui:bg-accent ui:text-accent-foreground'
                    : ''}"
                >
                  {@const Icon = item.icon}
                  <Icon size={16} class="nav-icon group-hover:animate-{item.id}" />
                  {item.title}
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
