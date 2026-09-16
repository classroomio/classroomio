<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { BackButton } from '@cio/ui';
  import {
    HoverableItem,
    PeopleIcon,
    AnalyticsIcon,
    LandingPageIcon,
    CertificateIcon,
    SettingsIcon,
    CourseIcon
  } from '@cio/ui/custom/moving-icons';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrgPath } from '$lib/utils/store/org';
  import type { LearningPathDetail } from '../../utils/types';

  interface Props {
    path: LearningPathDetail;
  }

  let { path }: Props = $props();

  const currentPath = $derived(page.url.pathname);
  const pathsListPath = $derived(`${$currentOrgPath}/paths`);
  const basePath = $derived(`/paths/${path.id}`);

  const tabs = $derived([
    {
      id: 'courses',
      label: $t('learningPath.workspace.tabs.courses'),
      href: `${basePath}/courses`,
      isActive: currentPath === `${basePath}/courses` || currentPath === basePath,
      icon: CourseIcon,
      badge: path.courses ? path.courses.length : 0
    },
    {
      id: 'people',
      label: $t('learningPath.workspace.tabs.people'),
      href: `${basePath}/people`,
      isActive: currentPath.startsWith(`${basePath}/people`),
      icon: PeopleIcon,
      badge: path.memberCount || 0
    },
    {
      id: 'analytics',
      label: $t('learningPath.workspace.tabs.analytics'),
      href: `${basePath}/analytics`,
      isActive: currentPath.startsWith(`${basePath}/analytics`),
      icon: AnalyticsIcon
    },
    {
      id: 'landing',
      label: $t('learningPath.workspace.tabs.landing'),
      href: `${basePath}/landing`,
      isActive: currentPath.startsWith(`${basePath}/landing`),
      icon: LandingPageIcon
    },
    {
      id: 'certificate',
      label: $t('learningPath.workspace.tabs.certificate'),
      href: `${basePath}/certificate`,
      isActive: currentPath.startsWith(`${basePath}/certificate`),
      icon: CertificateIcon
    },
    {
      id: 'settings',
      label: $t('learningPath.workspace.tabs.settings'),
      href: `${basePath}/settings`,
      isActive: currentPath.startsWith(`${basePath}/settings`),
      icon: SettingsIcon
    }
  ]);
</script>

<Sidebar.Group class="pt-0!">
  <BackButton href={resolve(pathsListPath, {})} label={$t('org_navigation.learning_paths')} class="px-2! py-2!" />

  <Sidebar.Menu>
    {#each tabs as tab (tab.id)}
      <Sidebar.MenuItem>
        <Sidebar.MenuButton tooltipContent={tab.label} isActive={tab.isActive}>
          {#snippet child({ props })}
            <HoverableItem>
              {#snippet children(isHovered)}
                <a href={resolve(tab.href, {})} {...props}>
                  <tab.icon {isHovered} size={16} />
                  <span>{tab.label}</span>
                  {#if tab.badge !== undefined && tab.badge > 0}
                    <span class="ui:text-muted-foreground ml-auto text-xs tabular-nums">
                      {tab.badge}
                    </span>
                  {/if}
                </a>
              {/snippet}
            </HoverableItem>
          {/snippet}
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    {/each}
  </Sidebar.Menu>
</Sidebar.Group>
