<script lang="ts">
  import * as Avatar from '@cio/ui/base/avatar';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import * as Table from '@cio/ui/base/table';
  import { Progress } from '@cio/ui/base/progress';
  import AwardIcon from '@lucide/svelte/icons/award';
  import CheckIcon from '@lucide/svelte/icons/check';
  import CopyIcon from '@lucide/svelte/icons/copy';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import EyeIcon from '@lucide/svelte/icons/eye';
  import TrashIcon from '@lucide/svelte/icons/trash';
  import UserIcon from '@lucide/svelte/icons/user';
  import { t } from '$lib/utils/functions/translations';
  import { ComingSoon } from '$features/ui';
  import { TruncatedWithTooltip } from '$features/ui';
  import type { LearningPathMemberItem } from '../../utils/types';
  import {
    formatPathShortDate,
    getPathMemberDisplayEmail,
    getPathMemberProgressPercent,
    isPathStudentMember,
    obscurePathMemberEmail
  } from '../../utils/path-people-utils';

  interface Props {
    member: LearningPathMemberItem;
    isSelf?: boolean;
    showActions?: boolean;
    canManage?: boolean;
    canView?: boolean;
    navigable?: boolean;
    onView?: (member: LearningPathMemberItem) => void;
    onRemove?: (member: LearningPathMemberItem) => void;
    onRowClick?: (member: LearningPathMemberItem, event: MouseEvent) => void;
    onRowKeydown?: (member: LearningPathMemberItem, event: KeyboardEvent) => void;
  }

  let {
    member,
    isSelf = false,
    showActions = false,
    canManage = true,
    canView = true,
    navigable = false,
    onView,
    onRemove,
    onRowClick,
    onRowKeydown
  }: Props = $props();

  let copiedEmail = $state<string | null>(null);

  const displayName = $derived(member.fullName ?? getPathMemberDisplayEmail(member));
  const displayEmail = $derived(getPathMemberDisplayEmail(member));
  const isStudent = $derived(isPathStudentMember(member));
  const progressPercent = $derived(getPathMemberProgressPercent(member) ?? 0);
  const isCompleted = $derived(member.status === 'COMPLETED');
  const isNotStarted = $derived(member.status === 'NOT_STARTED');

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      copiedEmail = text;
      setTimeout(() => {
        copiedEmail = null;
      }, 2000);
    } catch (error) {
      console.error('Failed to copy email:', error);
    }
  }
</script>

<Table.Row
  class={navigable
    ? 'group ui:hover:[&>td]:!ui:bg-secondary/80 focus-visible:[&>td]:ui:bg-secondary/80 cursor-pointer'
    : 'group'}
  tabindex={navigable ? 0 : undefined}
  onclick={navigable && onRowClick ? (event) => onRowClick?.(member, event) : undefined}
  onkeydown={navigable && onRowKeydown ? (event) => onRowKeydown?.(member, event) : undefined}
>
  <Table.Cell class="min-w-[220px]">
    <div class="flex items-start lg:items-center">
      <Avatar.Root class="mr-3">
        {#if member.avatarUrl}
          <Avatar.Image src={member.avatarUrl} alt={displayName ? displayName : 'User'} />
        {/if}
        <Avatar.Fallback>
          <UserIcon class="ui:size-4 ui:text-muted-foreground custom" />
        </Avatar.Fallback>
      </Avatar.Root>
      <div class="flex flex-col items-start lg:flex-row lg:items-center">
        <div class="mr-2">
          <p class="text-base font-normal dark:text-white">
            {displayName}
          </p>
          <p class="ui:text-primary line-clamp-1 text-xs">
            {obscurePathMemberEmail(displayEmail)}
          </p>
        </div>
        <div class="flex items-center">
          {#if canManage}
            <Button
              variant="secondary"
              size="icon"
              class="h-8 w-8 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
              onclick={(event) => {
                event.stopPropagation();
                void copyToClipboard(displayEmail);
              }}
            >
              {#if copiedEmail === displayEmail}
                <CheckIcon size={16} class="custom text-green-600" />
              {:else}
                <CopyIcon size={16} class="custom" />
              {/if}
            </Button>
          {/if}
          {#if isSelf}
            <ComingSoon label={$t('course.navItem.people.you')} />
          {/if}
        </div>
      </div>
    </div>
  </Table.Cell>

  <Table.Cell class="min-w-[140px]">
    {#if isStudent}
      <div class="flex items-center gap-3">
        <div class="w-24 flex-shrink-0">
          <Progress
            value={progressPercent}
            class={progressPercent >= 100 ? '[&_[data-slot=progress-indicator]]:ui:bg-emerald-500' : ''}
          />
        </div>
        <span
          class={`text-sm font-medium ${progressPercent >= 100 ? 'text-emerald-600 dark:text-emerald-400' : 'ui:text-foreground'}`}
        >
          {progressPercent}%
        </span>
      </div>
    {:else}
      <span class="ui:text-muted-foreground text-sm">—</span>
    {/if}
  </Table.Cell>

  <Table.Cell class="max-w-[220px]">
    {#if isStudent}
      {#if isCompleted}
        <Badge
          variant="outline"
          class="max-w-[200px] border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
        >
          <div class="flex min-w-0 items-center gap-1">
            <AwardIcon class="custom size-3.5 shrink-0" />
            <TruncatedWithTooltip
              text={$t('learningPath.people.badge.certificate_earned')}
              maxWidth="100%"
              class="text-emerald-700 dark:text-emerald-300"
            />
          </div>
        </Badge>
      {:else if isNotStarted}
        <Badge variant="outline" class="ui:bg-muted ui:text-muted-foreground max-w-[200px]">
          <TruncatedWithTooltip
            text={$t('learningPath.people.badge.not_started')}
            maxWidth="100%"
            class="ui:text-muted-foreground"
          />
        </Badge>
      {:else if member.currentCourseTitle}
        <div class="flex max-w-[220px] items-center gap-2">
          <span
            class="ui:bg-primary/10 ui:text-primary flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
          >
            {member.currentCourseOrder}
          </span>
          <div class="min-w-0 flex-1">
            <TruncatedWithTooltip
              text={member.currentCourseTitle}
              maxWidth="100%"
              class="ui:text-foreground text-sm font-medium"
            />
          </div>
        </div>
      {:else}
        <span class="ui:text-muted-foreground text-sm">—</span>
      {/if}
    {:else}
      <span class="ui:text-muted-foreground text-sm">—</span>
    {/if}
  </Table.Cell>

  <Table.Cell class="min-w-[110px]">
    <span class="ui:text-muted-foreground text-sm">
      {formatPathShortDate(member.lastActivityAt)}
    </span>
  </Table.Cell>

  <Table.Cell class="min-w-[110px]">
    <span class="ui:text-muted-foreground text-sm">
      {formatPathShortDate(member.enrolledAt)}
    </span>
  </Table.Cell>

  {#if showActions}
    <Table.Cell
      class="ui:bg-card group-hover:ui:bg-secondary/80 ui:border-border sticky right-0 z-10 w-12 border-l text-right shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.08)] transition-colors"
    >
      {#if canManage && !isSelf}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger
            class="ui:hover:bg-muted flex items-center justify-center rounded-md p-1"
            onclick={(event) => event.stopPropagation()}
          >
            <EllipsisVerticalIcon size={16} class="custom" />
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end">
            {#if canView && onView}
              <DropdownMenu.Item
                onclick={(event) => {
                  event.stopPropagation();
                  onView?.(member);
                }}
              >
                <EyeIcon class="custom mr-2 size-4" />
                {$t('course.navItem.people.view')}
              </DropdownMenu.Item>
            {/if}
            {#if onRemove}
              <DropdownMenu.Item
                class="text-red-600"
                onclick={(event) => {
                  event.stopPropagation();
                  onRemove?.(member);
                }}
              >
                <TrashIcon class="custom mr-2 size-4" />
                {$t('course.navItem.people.delete_profile')}
              </DropdownMenu.Item>
            {/if}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      {/if}
    </Table.Cell>
  {/if}
</Table.Row>
