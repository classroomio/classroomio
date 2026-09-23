<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { onDestroy, untrack } from 'svelte';
  import { Button } from '@cio/ui/base/button';
  import * as Page from '@cio/ui/base/page';
  import * as Select from '@cio/ui/base/select';
  import * as Table from '@cio/ui/base/table';
  import * as Tooltip from '@cio/ui/base/tooltip';
  import { Search } from '@cio/ui/custom/search';
  import * as Alert from '@cio/ui/base/alert';
  import { t } from '$lib/utils/functions/translations';
  import { ROLE } from '@cio/utils/constants';
  import { ROLES } from '$lib/utils/constants/roles';
  import { isOrgAdmin, isStudentLimitReached } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import {
    DeleteConfirmation,
    InvitePathMembersModal,
    PathMemberRow,
    deletePathMemberModal
  } from '$features/learning-path';
  import { RefreshPageData, TablePagination, UpgradeBanner } from '$features/ui';
  import { learningPathApi, pathMembersApi } from '$features/learning-path/api';
  import type { LearningPathMemberItem } from '$features/learning-path/utils/types';
  import {
    ALL_ROLES_FILTER,
    DEFAULT_PATH_PEOPLE_PAGE_SIZE,
    shouldIgnoreRowNavigation
  } from '$features/learning-path/utils/path-people-utils';

  let { data } = $props();

  let memberToRemove: { id: string; name: string; isStudent: boolean } = $state({
    id: '',
    name: '',
    isStudent: true
  });
  let roleFilter = $state(ALL_ROLES_FILTER);
  let progressFilter = $state('all');
  let searchValue = $state('');
  let currentPage = $state(1);
  let loadedPathId: string | null = null;
  let searchDebounceTimeout: ReturnType<typeof setTimeout> | null = null;

  const activePath = $derived(learningPathApi.currentPath);
  const pathId = $derived(activePath?.id);
  const totalMembers = $derived(pathMembersApi.membersPagination?.total ?? 0);
  const totalLearners = $derived(pathMembersApi.membersEnrolledTotal);
  const totalPages = $derived(pathMembersApi.membersPagination?.totalPages ?? 0);
  const pageSize = $derived(pathMembersApi.membersPagination?.limit ?? DEFAULT_PATH_PEOPLE_PAGE_SIZE);
  const courseCount = $derived(activePath?.courses.length ?? 0);

  const currentUserRole = $derived.by(() => {
    if (pathMembersApi.viewerRole !== undefined) return pathMembersApi.viewerRole;

    const currentMember = pathMembersApi.members.find((member) => member.profileId === $profile.id);
    return currentMember ? Number(currentMember.roleId) : null;
  });
  const canManageMembers = $derived.by(
    () => Boolean($isOrgAdmin) || currentUserRole === ROLE.ADMIN || currentUserRole === ROLE.TUTOR
  );

  const roleOptions = $derived(ROLES.map((role) => ({ label: $t(role.label), value: `${role.value}` })));
  const progressOptions = $derived([
    { label: $t('learningPath.people.filter.all'), value: 'all' },
    { label: $t('learningPath.people.filter.not_started'), value: 'NOT_STARTED' },
    { label: $t('learningPath.people.filter.in_progress'), value: 'IN_PROGRESS' },
    { label: $t('learningPath.people.filter.completed'), value: 'COMPLETED' }
  ]);
  const canFilterByProgress = (roleFilter) => roleFilter === ALL_ROLES_FILTER || Number(roleFilter) === ROLE.STUDENT;
  const showProgressFilter = $derived(canFilterByProgress(roleFilter));

  const stickyActionsHeadClass =
    'ui:bg-muted/95 sticky right-0 z-20 w-12 border-l ui:border-border shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.08)]';

  async function loadMembers(activePathId: string, pageNumber: number) {
    const roleId = roleFilter === ALL_ROLES_FILTER ? undefined : Number(roleFilter);

    await pathMembersApi.listMembers(activePathId, {
      page: pageNumber,
      limit: DEFAULT_PATH_PEOPLE_PAGE_SIZE,
      status: progressFilter === 'all' ? undefined : (progressFilter as 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'),
      roleId,
      search: searchValue.trim() || undefined
    });

    const echoedPage = pathMembersApi.membersPagination?.page;
    if (echoedPage) {
      currentPage = echoedPage;
    }
  }

  function reloadFirstPage() {
    if (!pathId) return;

    currentPage = 1;
    void loadMembers(pathId, 1);
  }

  function refreshCurrentPage() {
    if (!pathId) return;

    void loadMembers(pathId, currentPage);
  }

  function handleSearchValueChange(value: string) {
    searchValue = value;

    if (searchDebounceTimeout) {
      clearTimeout(searchDebounceTimeout);
    }

    searchDebounceTimeout = setTimeout(reloadFirstPage, 300);
  }

  function handleRoleChange(value: string) {
    roleFilter = value;

    // Progress is meaningless for staff-only views; clear a stale status filter
    // so it cannot silently empty the list.
    if (!canFilterByProgress(roleFilter)) {
      progressFilter = 'all';
    }

    reloadFirstPage();
  }

  function handleProgressChange(value: string) {
    progressFilter = value;
    reloadFirstPage();
  }

  function handlePageChange(nextPage: number) {
    if (!pathId) return;

    currentPage = nextPage;
    void loadMembers(pathId, nextPage);
  }

  function handleRemovedMember() {
    const nextPage = pathMembersApi.members.length === 0 && currentPage > 1 ? currentPage - 1 : currentPage;
    currentPage = nextPage;

    if (pathId) {
      void loadMembers(pathId, nextPage);
    }
  }

  function openRemoveDialog(member: LearningPathMemberItem) {
    memberToRemove = {
      id: member.id,
      name: member.fullName ?? member.profileEmail ?? member.email ?? '',
      isStudent: Number(member.roleId) === ROLE.STUDENT
    };
    deletePathMemberModal.set({ open: true });
  }

  function gotoMember(member: LearningPathMemberItem) {
    goto(`${page.url.pathname}/${member.profileId}`);
  }

  function handleRowClick(member: LearningPathMemberItem, event: MouseEvent) {
    if (shouldIgnoreRowNavigation(event)) return;

    gotoMember(member);
  }

  function handleRowKeydown(member: LearningPathMemberItem, event: KeyboardEvent) {
    if (shouldIgnoreRowNavigation(event)) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;

    event.preventDefault();
    gotoMember(member);
  }

  function openInviteModal() {
    goto(`${page.url.pathname}?add=true`);
  }

  async function handleRefresh() {
    if (pathId) {
      await learningPathApi.refreshPath(data.publicId);
      refreshCurrentPage();
    }
  }

  // Only the path id retriggers a load; reads inside loadMembers would otherwise
  // refetch on every keystroke.
  $effect(() => {
    const id = pathId;
    if (!id || id === loadedPathId) return;

    loadedPathId = id;
    untrack(() => {
      reloadFirstPage();
      if ($profile.id) {
        void pathMembersApi.fetchViewerRole(id, $profile.id);
      }
    });
  });

  onDestroy(() => {
    if (searchDebounceTimeout) {
      clearTimeout(searchDebounceTimeout);
    }
  });
</script>

<Page.Root class="mx-auto w-[90%] px-4 md:max-w-5xl">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('learningPath.people.title')}</Page.Title>
      <Page.Subtitle
        >{#if totalLearners !== null}{$t('learningPath.people.subtitle', { count: totalLearners })}{/if}</Page.Subtitle
      >
    </Page.HeaderContent>
    <Page.Action>
      <div class="flex items-center gap-2">
        {#if canManageMembers}
          <Button onclick={openInviteModal} testId="path-people-add-learners">
            {$t('course.navItem.people.add')}
          </Button>
        {/if}
        <RefreshPageData onRefresh={handleRefresh} />
      </div>
    </Page.Action>
  </Page.Header>

  <Page.Body>
    {#snippet child()}
      {#if $isStudentLimitReached}
        <UpgradeBanner className="mb-2">{$t('course.navItem.people.invite_modal.student_limit_reached')}</UpgradeBanner>
      {/if}

      <section class="space-y-2">
        <Alert.Callout
          variant="information"
          title={$t('learningPath.people.info_title')}
          description={$t('learningPath.people.info_banner', { count: courseCount })}
        />

        <div class="flex flex-col items-center justify-end gap-2 md:flex-row">
          <Search
            placeholder={$t('learningPath.people.search_placeholder')}
            bind:value={searchValue}
            onValueChange={handleSearchValueChange}
          />
          <Select.Root type="single" name="roles" bind:value={roleFilter} onValueChange={handleRoleChange}>
            <Select.Trigger class="max-w-[100px]">
              {roleOptions.find((option) => option.value === roleFilter)?.label}
            </Select.Trigger>
            <Select.Content>
              <Select.Group>
                {#each roleOptions as option (option.value)}
                  <Select.Item value={option.value} label={option.label} disabled={option.value === roleFilter}>
                    {option.label}
                  </Select.Item>
                {/each}
              </Select.Group>
            </Select.Content>
          </Select.Root>
          {#if showProgressFilter}
            <Select.Root type="single" name="progress" bind:value={progressFilter} onValueChange={handleProgressChange}>
              <Select.Trigger class="max-w-[140px]">
                {progressOptions.find((option) => option.value === progressFilter)?.label}
              </Select.Trigger>
              <Select.Content>
                <Select.Group>
                  {#each progressOptions as option (option.value)}
                    <Select.Item value={option.value} label={option.label} disabled={option.value === progressFilter}>
                      {option.label}
                    </Select.Item>
                  {/each}
                </Select.Group>
              </Select.Content>
            </Select.Root>
          {/if}
        </div>

        <div class="overflow-x-auto rounded-md border">
          <Tooltip.Provider>
            <Table.Root class="min-w-[880px]">
              <Table.Header>
                <Table.Row>
                  <Table.Head>{$t('learningPath.people.table.learner')}</Table.Head>
                  <Table.Head>{$t('learningPath.people.table.progress')}</Table.Head>
                  <Table.Head class="max-w-[220px]">{$t('learningPath.people.table.current_course')}</Table.Head>
                  <Table.Head>{$t('course.navItem.people.last_login_at')}</Table.Head>
                  <Table.Head>{$t('learningPath.people.table.enrolled')}</Table.Head>
                  <Table.Head class={stickyActionsHeadClass}></Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {#if pathMembersApi.isLoadingMembers && pathMembersApi.members.length === 0}
                  <Table.Row>
                    <Table.Cell colspan={6} class="ui:text-muted-foreground py-8 text-center text-sm">
                      {$t('course.navItem.people.invite_modal.loading')}
                    </Table.Cell>
                  </Table.Row>
                {:else if pathMembersApi.members.length === 0}
                  <Table.Row>
                    <Table.Cell colspan={6} class="ui:text-muted-foreground py-8 text-center text-sm">
                      {searchValue.trim() || roleFilter !== ALL_ROLES_FILTER || progressFilter !== 'all'
                        ? $t('learningPath.people.no_results')
                        : $t('learningPath.people.empty')}
                    </Table.Cell>
                  </Table.Row>
                {:else}
                  {#each pathMembersApi.members as member (member.id)}
                    <PathMemberRow
                      {member}
                      isSelf={member.profileId === $profile.id}
                      showActions
                      canManage={canManageMembers}
                      canView={canManageMembers}
                      navigable
                      onView={gotoMember}
                      onRemove={openRemoveDialog}
                      onRowClick={handleRowClick}
                      onRowKeydown={handleRowKeydown}
                    />
                  {/each}
                {/if}
              </Table.Body>
            </Table.Root>
          </Tooltip.Provider>
        </div>

        {#if totalPages > 1}
          <div class="pt-4">
            <TablePagination
              count={totalMembers}
              perPage={pageSize}
              page={currentPage}
              onPageChange={handlePageChange}
            />
          </div>
        {/if}
      </section>
    {/snippet}
  </Page.Body>
</Page.Root>

{#if pathId}
  <InvitePathMembersModal {pathId} onMembersChanged={refreshCurrentPage} />
{/if}

<DeleteConfirmation
  pathId={pathId ?? ''}
  memberId={memberToRemove.id}
  memberName={memberToRemove.name}
  isStudent={memberToRemove.isStudent}
  onRemoved={handleRemovedMember}
/>
