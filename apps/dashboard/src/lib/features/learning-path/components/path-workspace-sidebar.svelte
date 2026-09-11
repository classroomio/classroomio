<script lang="ts">
  import { page } from '$app/state';
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import UsersIcon from '@lucide/svelte/icons/users';
  import BarChart3Icon from '@lucide/svelte/icons/bar-chart-3';
  import GlobeIcon from '@lucide/svelte/icons/globe';
  import AwardIcon from '@lucide/svelte/icons/award';
  import SettingsIcon from '@lucide/svelte/icons/settings';
  import { PathIcon } from '@cio/ui/custom/moving-icons';
  import { profile } from '$lib/utils/store/user';
  import { t } from '$lib/utils/functions/translations';
  import type { LearningPathDetail } from '../utils/types';

  interface Props {
    path: LearningPathDetail;
    orgSlug: string;
  }

  let { path, orgSlug }: Props = $props();

  const currentUrl = $derived(page.url.pathname);
  const backHref = $derived(`/org/${orgSlug}/paths`);
  const basePath = $derived(`/org/${orgSlug}/paths/${path.id}`);

  const tabs = $derived([
    {
      id: 'courses',
      label: $t('learningPath.workspace.tabs.courses') || 'Courses',
      href: `${basePath}/courses`,
      icon: BookOpenIcon,
      badge: path.courses ? path.courses.length : 0
    },
    {
      id: 'people',
      label: $t('learningPath.workspace.tabs.people') || 'People',
      href: `${basePath}/people`,
      icon: UsersIcon,
      badge: path.memberCount || 0
    },
    {
      id: 'analytics',
      label: $t('learningPath.workspace.tabs.analytics') || 'Analytics',
      href: `${basePath}/analytics`,
      icon: BarChart3Icon
    },
    {
      id: 'landing',
      label: $t('learningPath.workspace.tabs.landing') || 'Landing page',
      href: `${basePath}/landing`,
      icon: GlobeIcon
    },
    {
      id: 'certificate',
      label: $t('learningPath.workspace.tabs.certificate') || 'Certificate',
      href: `${basePath}/certificate`,
      icon: AwardIcon
    },
    {
      id: 'settings',
      label: $t('learningPath.workspace.tabs.settings') || 'Settings',
      href: `${basePath}/settings`,
      icon: SettingsIcon
    }
  ]);

  const initials = $derived(
    $profile.fullname
      ? $profile.fullname
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
      : 'AD'
  );
</script>

<aside class="border-sidebar-border bg-sidebar text-sidebar-foreground flex h-screen w-64 shrink-0 flex-col border-r">
  <!-- Back link -->
  <div class="border-sidebar-border/50 border-b p-3">
    <a
      href={backHref}
      class="text-muted-foreground hover:text-sidebar-foreground inline-flex items-center gap-2 text-xs font-medium transition"
    >
      <ArrowLeftIcon class="size-3.5" />
      <span>{$t('learningPath.workspace.all_paths')}</span>
    </a>
  </div>

  <!-- Path Identity -->
  <div class="border-sidebar-border/50 flex items-center gap-3 border-b p-4">
    <div class="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
      <PathIcon size={18} />
    </div>
    <div class="min-w-0 flex-1">
      <div class="text-sidebar-foreground truncate text-sm font-semibold tracking-tight">
        {path.name}
      </div>
      <div class="mt-0.5 flex items-center gap-1.5 text-xs">
        {#if path.status === 'ACTIVE'}
          <span class="size-1.5 rounded-full bg-green-500"></span>
          <span class="font-medium text-green-600 dark:text-green-400">{$t('learningPath.workspace.active')}</span>
        {:else if path.status === 'DRAFT'}
          <span class="size-1.5 rounded-full bg-amber-500"></span>
          <span class="font-medium text-amber-600 dark:text-amber-400">{$t('learningPath.workspace.draft')}</span>
        {:else}
          <span class="bg-muted-foreground size-1.5 rounded-full"></span>
          <span class="text-muted-foreground font-medium">{$t('learningPath.workspace.archived')}</span>
        {/if}
      </div>
    </div>
  </div>

  <!-- Tab navigation -->
  <nav class="flex-1 space-y-1 overflow-y-auto p-3">
    {#each tabs as tab (tab.id)}
      {@const isActive = currentUrl.startsWith(tab.href)}
      <a
        href={tab.href}
        class="flex items-center justify-between rounded-md px-3 py-2 text-xs font-medium transition {isActive
          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-2xs'
          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'}"
      >
        <div class="flex min-w-0 items-center gap-2.5">
          <tab.icon class="size-4 shrink-0 opacity-80" />
          <span class="truncate">{tab.label}</span>
        </div>
        {#if tab.badge !== undefined}
          <span
            class="py-0.2 rounded-full px-2 font-mono text-[10.5px] tabular-nums {isActive
              ? 'bg-primary/20 text-primary font-bold'
              : 'bg-muted text-muted-foreground'}"
          >
            {tab.badge}
          </span>
        {/if}
      </a>
    {/each}
  </nav>

  <!-- User Footer -->
  <div class="border-sidebar-border/50 flex items-center gap-3 border-t p-3">
    <div
      class="bg-muted text-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
    >
      {initials}
    </div>
    <div class="min-w-0 flex-1">
      <div class="text-sidebar-foreground truncate text-xs font-medium">
        {$profile.fullname || 'Admin User'}
      </div>
      <div class="text-muted-foreground truncate text-[11px]">Admin</div>
    </div>
  </div>
</aside>
