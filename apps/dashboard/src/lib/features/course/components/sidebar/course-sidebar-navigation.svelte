<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
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
  import { ContentType } from '@cio/utils/constants/content';
  import { contentCreateStoreUtils } from '$features/course/components/content/store';
  import { CONTENT_DEFINITIONS, getContentRoute, getCourseContent } from '$features/course/utils/content';

  import { NAV_IDS } from './constants';
  import { courseApi } from '$features/course/api';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg, isFreePlan, currentOrgPath } from '$lib/utils/store/org';
  import { globalStore } from '$lib/utils/store/app';
  import { getNavItemRoute, getLessonsRoute } from '$features/course/utils/functions';
  import { CircleCheckIcon } from '$features/ui/icons';

  interface Props {
    path: string;
    id: string;
    isStudent?: boolean;
  }

  let { path, id, isStudent = false }: Props = $props();

  const coursesListPath = $derived($globalStore.isOrgSite ? '/lms/mylearning' : `${$currentOrgPath}/courses`);
  const contentData = $derived(getCourseContent(courseApi.course));

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
    const contentGroupingEnabled = courseApi.course?.metadata?.isContentGroupingEnabled ?? true;

    if (sectionId) {
      contentCreateStoreUtils.openContentUnit(sectionId);
    } else if (contentGroupingEnabled) {
      contentCreateStoreUtils.openSection();
    } else {
      contentCreateStoreUtils.openDefault();
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
  <Button variant="link" class="h-fit! justify-start! px-2! py-2!" href={resolve(coursesListPath, {})}>
    <ArrowLeftIcon class="custom" />
    <span class="text-xs">{$t('org_navigation.courses')}</span>
  </Button>

  <Sidebar.Menu>
    {#each navItems as item (item.id)}
      <Collapsible.Root open={item.isActive} class="group/collapsible">
        {#snippet child({ props })}
          <Sidebar.MenuItem {...props}>
            {#if item.isLesson}
              <Collapsible.Trigger>
                {#snippet child({ props })}
                  <Sidebar.MenuButton {...props} tooltipContent={item.title} isActive={item.isActive}>
                    {#snippet child({ props })}
                      <HoverableItem class="">
                        {#snippet children(isHovered)}
                          {@const Icon = item.icon}
                          <a href={resolve(item.url, {})} {...props}>
                            {#if Icon === TableOfContentsIcon}
                              <Icon size={16} />
                            {:else}
                              <Icon {isHovered} size={16} />
                            {/if}
                            <span>{item.title}</span>

                            <div class="ml-auto flex items-center gap-1">
                              <Plus size={20} class="rounded-full p-1" onclick={() => openContentModal(id)} />

                              <ChevronRightIcon
                                size={20}
                                class="rounded-full p-1 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                              />
                            </div>
                          </a>
                        {/snippet}
                      </HoverableItem>
                    {/snippet}
                  </Sidebar.MenuButton>
                {/snippet}
              </Collapsible.Trigger>
              <Collapsible.Content>
                <Sidebar.MenuSub>
                  {#if contentData.grouped}
                    {#each contentData.sections as section (section.id)}
                      <Collapsible.Root open={true} class="group/section">
                        {#snippet child({ props })}
                          <Sidebar.MenuSubItem {...props}>
                            <Collapsible.Trigger>
                              {#snippet child({ props })}
                                <Sidebar.MenuSubButton {...props} class="flex w-full items-center gap-2 font-medium">
                                  {@const SectionIcon = CONTENT_DEFINITIONS[ContentType.Section].icon}
                                  <SectionIcon size={14} />
                                  <span class="flex-1 truncate">{section.title}</span>
                                  <div class="ml-auto flex items-center gap-1">
                                    <Plus
                                      size={20}
                                      class="rounded-full p-1 hover:bg-gray-200"
                                      onclick={() => openContentModal(id, section.id)}
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
                                {#each section.items as contentItem (contentItem.id)}
                                  <Sidebar.MenuSubItem>
                                    <Sidebar.MenuSubButton
                                      isActive={(path || page.url.pathname).includes(contentItem.id)}
                                    >
                                      {#snippet child({ props })}
                                        {@const ItemIcon = CONTENT_DEFINITIONS[contentItem.type].icon}
                                        {@const isContentLocked = (contentItem.isUnlocked ?? true) === false}
                                        {@const isLockedForStudent = isStudent && isContentLocked}
                                        <a
                                          href={isLockedForStudent
                                            ? '#'
                                            : resolve(getContentRoute(id, contentItem), {})}
                                          aria-disabled={isLockedForStudent}
                                          title={contentItem.title}
                                          class="flex w-full items-center gap-2 {isLockedForStudent
                                            ? 'cursor-not-allowed opacity-50'
                                            : ''}"
                                          onclick={(event) => {
                                            if (isLockedForStudent) {
                                              event.preventDefault();
                                            }
                                          }}
                                          {...props}
                                        >
                                          <ItemIcon size={14} />
                                          <span class="flex-1 truncate">{contentItem.title}</span>
                                          <div class="ml-auto flex items-center gap-1">
                                            {#if contentItem.isComplete}
                                              <span class="shrink-0">
                                                <CircleCheckIcon size={16} filled />
                                              </span>
                                            {/if}
                                            {#if isContentLocked}
                                              <span
                                                class="shrink-0"
                                                title={$t('course.navItem.lessons.add_lesson.lock')}
                                                aria-label={$t('course.navItem.lessons.add_lesson.lock')}
                                              >
                                                <LockIcon size={12} />
                                              </span>
                                            {/if}
                                          </div>
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
                  {:else}
                    {#each contentData.items as contentItem (contentItem.id)}
                      <Sidebar.MenuSubItem>
                        <Sidebar.MenuSubButton isActive={(path || page.url.pathname).includes(contentItem.id)}>
                          {#snippet child({ props })}
                            {@const ItemIcon = CONTENT_DEFINITIONS[contentItem.type].icon}
                            {@const isContentLocked = (contentItem.isUnlocked ?? true) === false}
                            {@const isLockedForStudent = isStudent && isContentLocked}
                            <a
                              href={isLockedForStudent ? '#' : resolve(getContentRoute(id, contentItem), {})}
                              aria-disabled={isLockedForStudent}
                              title={contentItem.title}
                              class="flex w-full items-center gap-2 {isLockedForStudent
                                ? 'cursor-not-allowed opacity-50'
                                : ''}"
                              onclick={(event) => {
                                if (isLockedForStudent) {
                                  event.preventDefault();
                                }
                              }}
                              {...props}
                            >
                              <ItemIcon size={14} />
                              <span class="flex-1 truncate">{contentItem.title}</span>
                              <div class="ml-auto flex items-center gap-1">
                                {#if contentItem.isComplete}
                                  <span class="shrink-0">
                                    <CircleCheckIcon size={16} filled />
                                  </span>
                                {/if}
                                {#if isContentLocked}
                                  <span
                                    class="shrink-0"
                                    title={$t('course.navItem.lessons.add_lesson.lock')}
                                    aria-label={$t('course.navItem.lessons.add_lesson.lock')}
                                  >
                                    <LockIcon size={12} />
                                  </span>
                                {/if}
                              </div>
                            </a>
                          {/snippet}
                        </Sidebar.MenuSubButton>
                      </Sidebar.MenuSubItem>
                    {/each}
                  {/if}
                </Sidebar.MenuSub>
              </Collapsible.Content>
            {:else}
              <Sidebar.MenuButton {...props} tooltipContent={item.title} isActive={item.isActive}>
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
