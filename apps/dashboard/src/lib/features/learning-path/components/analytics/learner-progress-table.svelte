<script lang="ts">
  import { goto } from '$app/navigation';
  import { Button } from '@cio/ui/base/button';
  import * as Pagination from '@cio/ui/base/pagination';
  import * as Table from '@cio/ui/base/table';
  import { UserAvatar } from '@cio/ui/custom/user-avatar';
  import { EmptyState } from '$features/ui';
  import UserIcon from '@lucide/svelte/icons/user';
  import { t } from '$lib/utils/functions/translations';
  import { calDateDiff } from '$lib/utils/functions/date';
  import { ROLE } from '@cio/utils/constants';
  import type { PathAnalyticsStudent } from '../../utils/types';
  import {
    formatCompletionRatio,
    getPathMemberDisplayEmail,
    shouldIgnoreRowNavigation
  } from '../../utils/path-people-utils';

  interface Props {
    students: PathAnalyticsStudent[];
    totalCourses: number;
    /** When provided, rows navigate to `${detailBasePath}/${profileId}?back=...`. */
    detailBasePath?: string | null;
    backPath?: string | null;
  }

  let { students, totalCourses, detailBasePath = null, backPath = null }: Props = $props();

  let currentPage = $state(1);
  const pageSize = 15;

  // Enrolled learners only (profile-backed), no staff rows and no pending
  // invites
  const learnerStudents = $derived(
    students.filter((student) => Number(student.roleId) === ROLE.STUDENT && student.profileId)
  );
  const totalPages = $derived(Math.ceil(learnerStudents.length / pageSize));
  const startIndex = $derived((currentPage - 1) * pageSize);
  const paginatedStudents = $derived(learnerStudents.slice(startIndex, startIndex + pageSize));

  $effect(() => {
    if (learnerStudents.length > 0 && currentPage > totalPages) {
      currentPage = 1;
    }
  });

  function gotoStudent(student: PathAnalyticsStudent) {
    if (!detailBasePath) return;

    const back = backPath ? `?back=${encodeURIComponent(backPath)}` : '';
    goto(`${detailBasePath}/${student.profileId}${back}`);
  }

  function handleRowClick(student: PathAnalyticsStudent, event: MouseEvent) {
    if (!detailBasePath || shouldIgnoreRowNavigation(event)) return;

    gotoStudent(student);
  }

  function handleRowKeydown(student: PathAnalyticsStudent, event: KeyboardEvent) {
    if (!detailBasePath || shouldIgnoreRowNavigation(event)) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;

    event.preventDefault();
    gotoStudent(student);
  }

  const navigableRowClass =
    'group cursor-pointer ui:hover:[&>td]:!ui:bg-secondary/80 focus-visible:[&>td]:ui:bg-secondary/80';
</script>

{#if learnerStudents.length === 0}
  <EmptyState
    title={$t('learningPath.analytics.empty')}
    description={$t('learningPath.analytics.empty_desc')}
    icon={UserIcon}
  />
{:else}
  <div class="ui:border-border relative max-h-[min(480px,70vh)] overflow-auto rounded-md border">
    <Table.Root class="min-w-[800px]">
      <Table.Header class="ui:bg-muted/80 sticky top-0 z-10 backdrop-blur-sm">
        <Table.Row>
          <Table.Head class="ui:bg-muted/95 sticky top-0 left-0 z-20 min-w-[200px] px-4 py-3 backdrop-blur-sm">
            {$t('learningPath.people.table.learner')}
          </Table.Head>
          <Table.Head class="min-w-[150px] px-4 py-3"
            >{$t('learningPath.analytics.students.courses_completed')}</Table.Head
          >
          <Table.Head class="min-w-[120px] px-4 py-3">{$t('analytics.last_seen')}</Table.Head>
          {#if detailBasePath}
            <Table.Head class="min-w-[120px] px-4 py-3">{$t('analytics.actions')}</Table.Head>
          {/if}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each paginatedStudents as student (student.id)}
          {@const displayName = student.fullName ?? getPathMemberDisplayEmail(student)}
          {@const ratio = formatCompletionRatio(student.completedCourseCount, totalCourses)}
          <Table.Row
            class={`group h-25 ${detailBasePath ? navigableRowClass : ''}`}
            tabindex={detailBasePath ? 0 : undefined}
            onclick={(event) => handleRowClick(student, event)}
            onkeydown={(event) => handleRowKeydown(student, event)}
          >
            <Table.Cell
              class="ui:bg-card ui:group-hover:bg-muted/50 sticky left-0 z-10 min-w-[200px] px-4 py-3 transition-colors"
            >
              <div class="flex items-center gap-3">
                <UserAvatar
                  src={student.avatarUrl}
                  alt={displayName ? displayName : $t('analytics.student')}
                  class="size-8"
                />
                <div class="min-w-0 flex-1">
                  <p class="ui:text-foreground truncate font-medium">
                    {displayName}
                  </p>
                  <p class="ui:text-muted-foreground truncate text-sm">
                    {getPathMemberDisplayEmail(student)}
                  </p>
                </div>
              </div>
            </Table.Cell>
            <Table.Cell class="min-w-[150px] px-4 py-3">
              <div class="flex items-center gap-3">
                <span class="ui:text-foreground text-sm font-medium">
                  {ratio}
                </span>
                <div class="w-20 flex-shrink-0">
                  <div class="ui:bg-muted h-2 rounded-full">
                    <div
                      class="h-2 rounded-full bg-blue-500"
                      style="width: {totalCourses > 0
                        ? Math.round(((student.completedCourseCount ?? 0) / totalCourses) * 100)
                        : 0}%"
                    ></div>
                  </div>
                </div>
              </div>
            </Table.Cell>
            <Table.Cell class="min-w-[120px] px-4 py-3">
              <span class="ui:text-muted-foreground text-sm">
                {student.lastActivityAt ? calDateDiff(student.lastActivityAt) : $t('analytics.a_while_ago')}
              </span>
            </Table.Cell>
            {#if detailBasePath}
              <Table.Cell class="min-w-[120px] px-4 py-3">
                <Button
                  variant="outline"
                  size="sm"
                  onclick={(event) => {
                    event.stopPropagation();
                    gotoStudent(student);
                  }}
                >
                  {$t('analytics.view_details')}
                </Button>
              </Table.Cell>
            {/if}
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </div>

  {#if learnerStudents.length > pageSize}
    <div class="mt-4 flex items-center justify-between">
      <div class="ui:text-muted-foreground text-sm">
        {$t('analytics.showing_students', {
          start: startIndex + 1,
          end: Math.min(startIndex + pageSize, learnerStudents.length),
          total: learnerStudents.length
        })}
      </div>

      <Pagination.Root
        count={learnerStudents.length}
        perPage={pageSize}
        page={currentPage}
        onPageChange={(page) => (currentPage = page)}
      >
        {#snippet children({ pages, currentPage: activePage })}
          <Pagination.Content>
            <Pagination.Item>
              <Pagination.PrevButton />
            </Pagination.Item>
            {#each pages as pageItem (pageItem.key)}
              {#if pageItem.type === 'ellipsis'}
                <Pagination.Item>
                  <Pagination.Ellipsis />
                </Pagination.Item>
              {:else}
                <Pagination.Item>
                  <Pagination.Link page={pageItem} isActive={activePage === pageItem.value}>
                    {pageItem.value}
                  </Pagination.Link>
                </Pagination.Item>
              {/if}
            {/each}
            <Pagination.Item>
              <Pagination.NextButton />
            </Pagination.Item>
          </Pagination.Content>
        {/snippet}
      </Pagination.Root>
    </div>
  {/if}
{/if}
