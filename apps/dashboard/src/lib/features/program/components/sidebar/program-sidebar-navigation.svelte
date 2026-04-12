<script lang="ts">
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { BackButton } from '@cio/ui';
  import { HoverableItem, NewsFeedIcon, CourseIcon, PeopleIcon, SettingsIcon } from '@cio/ui/custom/moving-icons';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrgPath, isOrgAdmin } from '$lib/utils/store/org';
  import { isStudentExperience } from '$lib/utils/store/app';
  import { profile } from '$lib/utils/store/user';
  import { programApi } from '$features/program/api';
  import { ROLE } from '@cio/utils/constants';

  interface Props {
    path: string;
    id: string;
  }

  let { path, id }: Props = $props();

  const currentPath = $derived(path || page.url.pathname);
  const isLmsProgramContext = $derived(page.url.searchParams.get('source') === 'lms' || $isStudentExperience);
  const programsListPath = $derived(isLmsProgramContext ? '/lms/programs' : `${$currentOrgPath}/programs`);

  const currentMemberRole = $derived(programApi.members.find((m) => m.profileId === $profile.id)?.roleId ?? null);

  // Admin + Tutor can manage members; org admins always can
  const canManageMembers = $derived(
    $isOrgAdmin === true || (currentMemberRole !== null && currentMemberRole <= ROLE.TUTOR)
  );

  // Only Admins and org admins can access settings
  const canManageSettings = $derived($isOrgAdmin === true || currentMemberRole === ROLE.ADMIN);

  const navItems = $derived(
    [
      {
        id: 'newsfeed',
        title: $t('programs.sidebar.newsfeed') || 'Newsfeed',
        url: `/programs/${id}/newsfeed`,
        isActive: currentPath.endsWith('/newsfeed'),
        icon: NewsFeedIcon,
        show: () => true
      },
      {
        id: 'courses',
        title: $t('programs.sidebar.courses') || 'Courses',
        url: `/programs/${id}/courses`,
        isActive: currentPath.endsWith('/courses'),
        icon: CourseIcon,
        show: () => true
      },
      {
        id: 'people',
        title: $t('programs.sidebar.people') || 'People',
        url: `/programs/${id}/people`,
        isActive: currentPath.endsWith('/people'),
        icon: PeopleIcon,
        show: () => canManageMembers
      },
      {
        id: 'settings',
        title: $t('programs.sidebar.settings') || 'Settings',
        url: `/programs/${id}/settings`,
        isActive: currentPath.endsWith('/settings'),
        icon: SettingsIcon,
        show: () => canManageSettings
      }
    ].filter((item) => item.show())
  );
</script>

<Sidebar.Group class="pt-0!">
  <BackButton
    href={resolve(programsListPath, {})}
    label={$t(isLmsProgramContext ? 'lms_navigation.programs' : 'org_navigation.programs') || 'Programs'}
    class="px-2! py-2!"
  />

  <Sidebar.Menu>
    {#each navItems as item (item.id)}
      <Sidebar.MenuItem>
        <Sidebar.MenuButton tooltipContent={item.title} isActive={item.isActive}>
          {#snippet child({ props })}
            <HoverableItem>
              {#snippet children(isHovered)}
                {@const Icon = item.icon}
                <a href={resolve(item.url, {})} {...props}>
                  <Icon {isHovered} size={16} />
                  <span>{item.title}</span>
                </a>
              {/snippet}
            </HoverableItem>
          {/snippet}
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    {/each}
  </Sidebar.Menu>
</Sidebar.Group>

<style>
  a {
    text-decoration: none;
  }
</style>
