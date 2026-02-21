<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import Plus from '@lucide/svelte/icons/plus';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { Button } from '@cio/ui/base/button';
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';

  import TableOfContentsIcon from '@lucide/svelte/icons/table-of-contents';
  import {
    AnalyticsIcon,
    AttendanceIcon,
    CertificateIcon,
    ContentIcon,
    HoverableItem,
    LandingPageIcon,
    MarksIcon,
    NewsFeedIcon,
    PeopleIcon,
    SettingsIcon,
    SubmissionIcon
  } from '@cio/ui/custom/moving-icons';
  import { ContentType } from '@cio/utils/constants/content';
  import { contentCreateStoreUtils, contentEditingStore } from '$features/course/components/content/store';
  import { getCourseContent } from '$features/course/utils/content';
  import CourseContentTree from './course-content-tree.svelte';
  import ContentCountBadges from '../content-count-badges.svelte';

  import { NAV_IDS } from './constants';
  import { courseApi } from '$features/course/api';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg, isFreePlan, currentOrgPath } from '$lib/utils/store/org';
  import { globalStore } from '$lib/utils/store/app';
  import { getNavItemRoute, getLessonsRoute } from '$features/course/utils/functions';
  import { useSidebar } from '@cio/ui/base/sidebar';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

  interface Props {
    path: string;
    id: string;
    isStudent?: boolean;
  }

  let { path, id, isStudent = false }: Props = $props();

  const coursesListPath = $derived($globalStore.isOrgSite ? '/lms/mylearning' : `${$currentOrgPath}/courses`);
  const contentData = $derived(getCourseContent(courseApi.course));
  const sidebar = useSidebar();
  const contentCount = $derived.by(() => {
    const contentItems = contentData.grouped
      ? contentData.sections.flatMap((section) => section.items)
      : contentData.items;
    const lessons = contentItems.filter((item) => item.type === ContentType.Lesson).length;
    const exercises = contentItems.filter((item) => item.type === ContentType.Exercise).length;

    return {
      lessons,
      exercises,
      total: lessons + exercises
    };
  });
  const showContentCount = $derived(sidebar.open && !sidebar.isMobile && contentCount.total > 0);

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
          (path || page.url.pathname).includes('/lessons') ||
          (path || page.url.pathname).includes('/exercises') ||
          (path || page.url.pathname) === getLessonsRoute(id),
        isLesson: true,
        icon: getNavIcon(NAV_IDS.LESSONS)
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

  function openContentModal(courseId: string, sectionId = '') {
    goto(resolve(`/courses/${courseId}/lessons`, {}));
    contentEditingStore.set(undefined);
    contentCreateStoreUtils.close();

    const contentGroupingEnabled = courseApi.course?.metadata?.isContentGroupingEnabled ?? true;

    if (sectionId) {
      contentCreateStoreUtils.openContentUnit(sectionId);
    } else if (contentGroupingEnabled) {
      contentCreateStoreUtils.openSection();
    } else {
      contentCreateStoreUtils.openDefault();
    }
  }

  function openSectionEditor(courseId: string, sectionId: string) {
    goto(resolve(`/courses/${courseId}/lessons`, {}));
    contentCreateStoreUtils.close();
    contentEditingStore.set(sectionId);
  }

  function getNavIcon(id: string) {
    if (!id) return null;

    if (id === NAV_IDS.SECTION) {
      return TableOfContentsIcon;
    } else if (id === NAV_IDS.NEWS_FEED) {
      return NewsFeedIcon;
    } else if (id === NAV_IDS.LESSONS) {
      return ContentIcon;
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
  <Button variant="link" class="h-fit! justify-start! px-2! py-2!" href={resolve(coursesListPath, {})}>
    <ArrowLeftIcon class="custom" />
    <span class="text-xs">{$t('org_navigation.courses')}</span>
  </Button>

  <Sidebar.Menu>
    {#each navItems as item (item.id)}
      {#if item.isLesson}
        <Sidebar.MenuItem>
          <Sidebar.MenuButton tooltipContent={item.title} isActive={item.isActive}>
            {#snippet child({ props })}
              <HoverableItem class="">
                {#snippet children(isHovered)}
                  <a href={resolve(item.url, {})} {...props}>
                    {#if item.icon}
                      {@const Icon = item.icon}
                      <Icon size={16} {isHovered} />
                    {/if}

                    <span>{item.title}</span>

                    <div class="ml-auto flex items-center gap-1">
                      <IconButton
                        variant="ghost-outline"
                        size="icon-xs"
                        class="transition-opacity duration-150 {isHovered ? 'opacity-100' : 'opacity-0'}"
                        onclick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          openContentModal(id);
                        }}
                      >
                        <Plus size={8} />
                      </IconButton>
                      {#if showContentCount}
                        <ContentCountBadges lessons={contentCount.lessons} exercises={contentCount.exercises} />
                      {/if}

                      <IconButton variant="ghost" size="icon-xs">
                        <ChevronRightIcon
                          class="transition-transform duration-200 {item.isActive ? 'rotate-90' : ''}"
                        />
                      </IconButton>
                    </div>
                  </a>
                {/snippet}
              </HoverableItem>
            {/snippet}
          </Sidebar.MenuButton>

          {#if item.isActive}
            <CourseContentTree
              {path}
              {id}
              {isStudent}
              className="mt-1 ml-2"
              onOpenContentModal={(sectionId) => openContentModal(id, sectionId)}
              onEditSection={(sectionId) => openSectionEditor(id, sectionId)}
            />
          {/if}
        </Sidebar.MenuItem>
      {:else}
        <Sidebar.MenuItem>
          <Sidebar.MenuButton tooltipContent={item.title} isActive={item.isActive}>
            {#snippet child({ props })}
              <HoverableItem>
                {#snippet children(isHovered)}
                  {@const Icon = item.icon}
                  <a href={resolve(item.url, {})} {...props}>
                    {#if Icon === TableOfContentsIcon}
                      <Icon size={16} />
                    {:else}
                      <Icon {isHovered} size={16} />
                    {/if}
                    <span>{item.title}</span>
                  </a>
                {/snippet}
              </HoverableItem>
            {/snippet}
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
      {/if}
    {/each}
  </Sidebar.Menu>
</Sidebar.Group>

<style>
  a {
    text-decoration: none;
  }
</style>
