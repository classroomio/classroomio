<script lang="ts">
  import { page } from '$app/state';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import LockIcon from '@lucide/svelte/icons/lock';
  import * as Collapsible from '@cio/ui/base/collapsible';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

  import { NAV_IDS } from './constants';
  import { profile } from '$lib/utils/store/user';
  import { sideBar } from '$lib/components/Org/store';
  import { course } from '$lib/components/Course/store';
  import { isMobile } from '$lib/utils/store/useMobile';
  import { t } from '$lib/utils/functions/translations';
  import { getIsLessonComplete } from '../Lesson/functions';
  import { currentOrg, isFreePlan } from '$lib/utils/store/org';
  import { COURSE_TYPE, COURSE_VERSION } from '$lib/utils/types';
  import { lessons, lessonSections } from '../Lesson/store/lessons';

  import NavIcons from './NavIcons.svelte';
  import TextChip from '$lib/components/Chip/Text.svelte';
  import CircleCheckIcon from '$lib/components/Icons/CircleCheckIcon.svelte';
  import { getNavItemRoute, getLessonsRoute, getLectureNo } from '$lib/components/Course/function';

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
          return isStudent ? $currentOrg.customization.course.newsfeed : true;
        }
      },
      {
        id: NAV_IDS.LESSONS,
        title: $t('course.navItems.nav_content'),
        url: getLessonsRoute($course.id),
        isActive:
          (path || page.url.pathname).includes('/lessons') ||
          (path || page.url.pathname) === getLessonsRoute($course.id),
        isLesson: true,
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
        }
      },
      {
        id: NAV_IDS.ATTENDANCE,
        title: $t('course.navItems.nav_attendance'),
        url: getNavItemRoute($course.id, 'attendance'),
        isActive: (path || page.url.pathname) === getNavItemRoute($course.id, 'attendance'),
        show() {
          if ($course.type !== COURSE_TYPE.LIVE_CLASS) return false;
          return true;
        }
      },
      {
        id: NAV_IDS.SUBMISSIONS,
        title: $t('course.navItems.nav_submissions'),
        url: getNavItemRoute($course.id, 'submissions'),
        isActive: (path || page.url.pathname) === getNavItemRoute($course.id, 'submissions'),
        show() {
          if (isStudent) return false;
          return true;
        }
      },
      {
        id: NAV_IDS.MARKS,
        title: $t('course.navItems.nav_marks'),
        url: getNavItemRoute($course.id, 'marks'),
        isActive: (path || page.url.pathname) === getNavItemRoute($course.id, 'marks'),
        show() {
          if ($course.type == COURSE_TYPE.LIVE_CLASS) {
            return isStudent ? $currentOrg.customization.course.grading : true;
          }
          return false;
        }
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
        }
      },
      {
        id: NAV_IDS.LANDING_PAGE,
        title: $t('course.navItems.nav_landing_page'),
        url: getNavItemRoute($course.id, 'landingpage'),
        isActive: (path || page.url.pathname) === getNavItemRoute($course.id, 'landingpage'),
        show() {
          return !isStudent;
        }
      },
      {
        id: NAV_IDS.PEOPLE,
        title: $t('course.navItems.nav_people'),
        url: getNavItemRoute($course.id, 'people'),
        isActive: (path || page.url.pathname) === getNavItemRoute($course.id, 'people'),
        show() {
          return !isStudent;
        }
      },
      {
        id: NAV_IDS.SETTINGS,
        title: $t('course.navItems.nav_settings'),
        url: getNavItemRoute($course.id, 'settings'),
        isActive: (path || page.url.pathname) === getNavItemRoute($course.id, 'settings'),
        show() {
          return !isStudent;
        }
      }
    ].filter((item) => !item.show || item.show())
  );

  const toggleSidebarOnMobile = () => $isMobile && ($sideBar.hidden = !$sideBar.hidden);
</script>

<Sidebar.Provider class="flex w-fit items-start gap-2">
  <Sidebar.Root collapsible="icon" class="inset-y-12 h-[calc(100vh-48px)] {$sideBar.hidden ? 'hidden' : ''}">
    <Sidebar.Content>
      <Sidebar.Group>
        <Sidebar.GroupLabel>Course Navigation</Sidebar.GroupLabel>
        <Sidebar.Menu>
          {#each navItems as item (item.id)}
            <Collapsible.Root open={item.isActive || (item.isLesson && item.isActive)} class="group/collapsible">
              {#snippet child({ props })}
                <Sidebar.MenuItem {...props}>
                  {#if item.isLesson && item.items}
                    <Collapsible.Trigger>
                      {#snippet child({ props })}
                        <Sidebar.MenuButton {...props} tooltipContent={item.title}>
                          <a href={item.url} onclick={toggleSidebarOnMobile} class="flex w-full items-center gap-4"
                            ><NavIcons name={item.id} /> {item.title}</a
                          >
                          <ChevronRightIcon
                            class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                          />
                        </Sidebar.MenuButton>
                      {/snippet}
                    </Collapsible.Trigger>
                    <Collapsible.Content>
                      <Sidebar.MenuSub>
                        {#each item.items as lessonItem}
                          <Sidebar.MenuSubItem>
                            <Sidebar.MenuSubButton>
                              {#snippet child({ props })}
                                <a
                                  href={isStudent && !lessonItem.lesson.is_unlocked
                                    ? page.url.pathname
                                    : lessonItem.url}
                                  onclick={toggleSidebarOnMobile}
                                  aria-disabled={!lessonItem.lesson.is_unlocked}
                                  title={lessonItem.lesson.title}
                                  class="flex w-full items-center gap-2 {isStudent && !lessonItem.lesson.is_unlocked
                                    ? 'cursor-not-allowed opacity-50'
                                    : ''} {(path || page.url.pathname).includes(lessonItem.lesson.id)
                                    ? 'bg-accent text-accent-foreground'
                                    : ''}"
                                  {...props}
                                >
                                  {#if lessonItem.isV1 && 'index' in lessonItem}
                                    <TextChip
                                      value={getLectureNo(lessonItem.index + 1)}
                                      className="bg-primary-200 text-primary-600 text-xs"
                                      size="sm"
                                      shape="rounded-full"
                                    />
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
                      </Sidebar.MenuSub>
                    </Collapsible.Content>
                  {:else}
                    <Sidebar.MenuButton tooltipContent={item.title}>
                      <a
                        href={item.url}
                        onclick={toggleSidebarOnMobile}
                        class="flex w-full items-center gap-4 {item.isActive ? 'bg-accent text-accent-foreground' : ''}"
                      >
                        <NavIcons name={item.id} />
                        {item.title}
                      </a>
                    </Sidebar.MenuButton>
                  {/if}
                </Sidebar.MenuItem>
              {/snippet}
            </Collapsible.Root>
          {/each}
        </Sidebar.Menu>
      </Sidebar.Group>
    </Sidebar.Content>
    <Sidebar.Rail />
  </Sidebar.Root>

  <Sidebar.Inset>
    <Sidebar.Trigger />
  </Sidebar.Inset>
</Sidebar.Provider>
