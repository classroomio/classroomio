<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import * as Avatar from '@cio/ui/base/avatar';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import * as Dialog from '@cio/ui/base/dialog';
  import * as Page from '@cio/ui/base/page';
  import * as Table from '@cio/ui/base/table';
  import { Search } from '@cio/ui/custom/search';
  import { Chip } from '@cio/ui/custom/chip';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
  import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
  import CheckIcon from '@lucide/svelte/icons/check';
  import CopyIcon from '@lucide/svelte/icons/copy';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import TrashIcon from '@lucide/svelte/icons/trash';
  import UserIcon from '@lucide/svelte/icons/user';
  import { onDestroy, untrack } from 'svelte';
  import { t } from '$lib/utils/functions/translations';
  import { shortenName } from '$lib/utils/functions/string';
  import { ROLE } from '@cio/utils/constants';
  import { ROLE_LABEL } from '$lib/utils/constants/roles';
  import { isOrgAdmin, isStudentLimitReached } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { TablePagination, UpgradeBanner } from '$features/ui';
  import { snackbar } from '$features/ui/snackbar/store';
  import InviteMembersModal from '$features/cohort/components/invite-members-modal.svelte';
  import GoalsOverviewTiles from '$features/cohort/components/goals/goals-overview-tiles.svelte';
  import PeopleFilterPopover from '$features/cohort/components/people-filter-popover.svelte';
  import PeopleViewSwitcher from '$features/cohort/components/people-view-switcher.svelte';
  import { cohortApi } from '$features/cohort/api';
  import { formatPeopleShortDate } from '$features/course/utils/people-utils';
  import {
    applyCohortPeopleView,
    clearCohortPeopleFilters,
    countActiveCohortPeopleFilters,
    getCohortPeopleQueryFromSearchParams,
    getCohortPeopleSearchParams,
    matchCohortPeopleView
  } from '$features/cohort/utils/people-query-utils';
  import type { CohortPeopleView, CohortPerson, ListCohortPeopleQuery } from '$features/cohort/utils/types';

  let { data } = $props();

  let memberToDelete = $state<CohortPerson | null>(null);
  let isDeleteModalOpen = $state(false);
  let searchValue = $state('');
  let copiedEmail = $state<string | null>(null);
  let peopleRows = $state<CohortPerson[]>([]);
  let peoplePagination = $state<{ page: number; limit: number; total: number; totalPages: number } | null>(null);
  let isLoadingPeople = $state(false);
  let peopleRequestId = 0;
  let searchDebounceTimeout: ReturnType<typeof setTimeout> | null = null;
  let loadedQueryKey: string | null = null;

  const query = $derived(getCohortPeopleQueryFromSearchParams(page.url.searchParams));
  const activeView = $derived(matchCohortPeopleView(query));
  const activeFilterCount = $derived(countActiveCohortPeopleFilters(query));

  const currentUserRole = $derived.by(() => {
    const currentMember = cohortApi.members.find((member) => member.profileId === $profile.id);
    return currentMember ? Number(currentMember.roleId) : null;
  });
  const canManageMembers = $derived.by(
    () => Boolean($isOrgAdmin) || currentUserRole === ROLE.ADMIN || currentUserRole === ROLE.TUTOR
  );

  const tableColumns: { label: string; sortKey?: ListCohortPeopleQuery['sortBy'] }[] = $derived([
    { label: $t('cohorts.people.name'), sortKey: 'name' },
    { label: $t('course.navItem.people.role'), sortKey: 'role' },
    { label: $t('course.navItem.people.last_login_at'), sortKey: 'lastLogin' },
    { label: $t('cohorts.people.joined'), sortKey: 'joined' }
  ]);

  async function navigatePeople(nextQuery: ListCohortPeopleQuery) {
    const searchParams = getCohortPeopleSearchParams(nextQuery, page.url.searchParams);
    const nextSearch = searchParams.toString();
    if (nextSearch === page.url.searchParams.toString()) return;

    try {
      await goto(`${page.url.pathname}?${nextSearch}`, { keepFocus: true, noScroll: true });
    } catch (error) {
      console.error('navigation failed:', error);
    }
  }

  async function loadPeople(cohortId: string, activeQuery: ListCohortPeopleQuery) {
    const requestId = ++peopleRequestId;
    isLoadingPeople = true;

    try {
      const response = await cohortApi.listPeople(cohortId, activeQuery);
      if (requestId !== peopleRequestId) return;

      if (response?.data) {
        peopleRows = response.data;
        peoplePagination = response.pagination ?? null;
      }
    } catch (error) {
      console.error('Failed to load cohort people:', error);
      if (requestId === peopleRequestId) {
        snackbar.error('snackbar.something');
      }
    } finally {
      if (requestId === peopleRequestId) {
        isLoadingPeople = false;
      }
    }
  }

  // Svelte effects re-run on any read value, so the fetch is untracked to keep the
  // local search box from retriggering it on every keystroke.
  $effect(() => {
    const cohortId = data.cohortId;
    const activeQuery = query;
    if (!cohortId) return;

    const queryKey = `${cohortId}:${JSON.stringify(activeQuery)}`;
    if (queryKey === loadedQueryKey) return;

    loadedQueryKey = queryKey;
    untrack(() => void loadPeople(cohortId, activeQuery));
  });

  $effect(() => {
    searchValue = query.search ?? '';
  });

  onDestroy(() => {
    if (searchDebounceTimeout) {
      clearTimeout(searchDebounceTimeout);
    }
  });

  function handleFilterChange(patch: Partial<ListCohortPeopleQuery>) {
    void navigatePeople({ ...query, ...patch, page: 1 });
  }

  function handleSortChange(sortBy: ListCohortPeopleQuery['sortBy'], sortOrder: ListCohortPeopleQuery['sortOrder']) {
    void navigatePeople({ ...query, sortBy, sortOrder, page: 1 });
  }

  function handlePageChange(nextPage: number) {
    void navigatePeople({ ...query, page: nextPage });
  }

  function handleSelectView(view: CohortPeopleView) {
    void navigatePeople(applyCohortPeopleView(view, query));
  }

  function handleClearFilters() {
    void navigatePeople(clearCohortPeopleFilters(query));
  }

  function handleSortByHeader(sortKey: ListCohortPeopleQuery['sortBy']) {
    const sortOrder = query.sortBy === sortKey && query.sortOrder === 'asc' ? 'desc' : 'asc';
    handleSortChange(sortKey, sortOrder);
  }

  function handleSearchValueChange(value: string) {
    searchValue = value;

    if (searchDebounceTimeout) {
      clearTimeout(searchDebounceTimeout);
    }

    searchDebounceTimeout = setTimeout(() => {
      void navigatePeople({ ...query, page: 1, search: value.trim() || undefined });
    }, 300);
  }

  function getEmail(person: CohortPerson) {
    return person.profile?.email ?? person.email ?? '';
  }

  function obscureEmail(email: string) {
    const [username = '', domain = ''] = email.split('@');
    if (username.length <= 2) {
      return email;
    }

    const obscuredUsername =
      username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1);

    return `${obscuredUsername}@${domain}`;
  }

  function getRoleLabel(roleId: number) {
    if (roleId === ROLE.ADMIN) {
      return $t(ROLE_LABEL[ROLE.ADMIN]);
    }

    if (roleId === ROLE.TUTOR) {
      return $t(ROLE_LABEL[ROLE.TUTOR]);
    }

    return $t(ROLE_LABEL[ROLE.STUDENT]);
  }

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

  async function deletePerson() {
    if (!memberToDelete) {
      return;
    }

    cohortApi.success = false;

    await cohortApi.removeMember(data.cohortId, memberToDelete.id);
    if (cohortApi.success) {
      isDeleteModalOpen = false;
      memberToDelete = null;

      const nextPage = peopleRows.length <= 1 && query.page > 1 ? query.page - 1 : query.page;
      if (nextPage === query.page) {
        await loadPeople(data.cohortId, query);
      } else {
        await navigatePeople({ ...query, page: nextPage });
      }
    }
  }

  function openInviteModal() {
    const searchParams = new URLSearchParams(page.url.searchParams);
    searchParams.set('add', 'true');
    void goto(resolve(`${page.url.pathname}?${searchParams.toString()}`, {}));
  }
</script>

<Page.Root class="mx-auto w-[90%] md:max-w-3xl">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('cohorts.sidebar.people')}</Page.Title>
    </Page.HeaderContent>
    <Page.Action>
      {#if canManageMembers}
        <Button onclick={openInviteModal}>
          <PlusIcon size={16} />
          {$t('cohorts.people.invite')}
        </Button>
      {/if}
    </Page.Action>
  </Page.Header>

  <Page.Body>
    {#snippet child()}
      {#if $isStudentLimitReached}
        <UpgradeBanner className="mb-2">{$t('course.navItem.people.invite_modal.student_limit_reached')}</UpgradeBanner>
      {/if}

      <GoalsOverviewTiles cohortId={data.cohortId} />

      <section class="space-y-2">
        <div class="flex flex-col items-center justify-end gap-2 md:flex-row">
          <Search
            placeholder={$t('course.navItem.people.search')}
            bind:value={searchValue}
            onValueChange={handleSearchValueChange}
          />
          <PeopleFilterPopover
            {query}
            {activeFilterCount}
            isLoading={isLoadingPeople}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            onSortChange={handleSortChange}
          />
        </div>

        <div class="rounded-md border">
          <Table.Root>
            <Table.Header>
              <Table.Row>
                {#each tableColumns as column (column.label)}
                  <Table.Head>
                    {#if column.sortKey}
                      <button
                        type="button"
                        class="hover:text-foreground focus-visible:ring-ring flex items-center gap-1 rounded focus-visible:ring-2 focus-visible:outline-none"
                        onclick={() => handleSortByHeader(column.sortKey)}
                      >
                        {column.label}
                        {#if query.sortBy === column.sortKey}
                          {#if query.sortOrder === 'asc'}
                            <ArrowUpIcon class="size-3.5" aria-hidden="true" />
                          {:else}
                            <ArrowDownIcon class="size-3.5" aria-hidden="true" />
                          {/if}
                        {/if}
                      </button>
                    {:else}
                      {column.label}
                    {/if}
                  </Table.Head>
                {/each}
                <Table.Head>{$t('course.navItem.people.action')}</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {#if isLoadingPeople && peopleRows.length === 0}
                <Table.Row>
                  <Table.Cell colspan={5} class="ui:text-muted-foreground py-8 text-center text-sm">
                    {$t('course.navItem.people.invite_modal.loading')}
                  </Table.Cell>
                </Table.Row>
              {:else if peopleRows.length === 0}
                <Table.Row>
                  <Table.Cell colspan={5} class="ui:text-muted-foreground py-8 text-center text-sm">
                    {$t('cohorts.people.empty_title')}
                  </Table.Cell>
                </Table.Row>
              {:else}
                {#each peopleRows as person (person.id)}
                  <Table.Row>
                    <Table.Cell class="w-4/6 md:w-3/6">
                      {#if person.profile}
                        <div class="flex items-start lg:items-center">
                          <Avatar.Root class="mr-3">
                            {#if person.profile.avatarUrl}
                              <Avatar.Image
                                src={person.profile.avatarUrl}
                                alt={person.profile.fullname ? person.profile.fullname : 'User'}
                              />
                            {/if}
                            <Avatar.Fallback>
                              <UserIcon class="ui:text-muted-foreground size-4" />
                            </Avatar.Fallback>
                          </Avatar.Root>
                          <div class="flex flex-col items-start lg:flex-row lg:items-center">
                            <div class="mr-2">
                              <p class="text-base font-normal dark:text-white">
                                {person.profile.fullname}
                              </p>
                              <p class="ui:text-primary line-clamp-1 text-xs">
                                {obscureEmail(getEmail(person))}
                              </p>
                            </div>
                            <div class="flex items-center">
                              {#if canManageMembers}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  class="h-8 w-8"
                                  onclick={() => copyToClipboard(getEmail(person))}
                                >
                                  {#if copiedEmail === getEmail(person)}
                                    <CheckIcon size={16} class="text-green-600" />
                                  {:else}
                                    <CopyIcon size={16} />
                                  {/if}
                                </Button>
                              {/if}
                              {#if person.profileId === $profile.id}
                                <Badge variant="secondary">{$t('course.navItem.people.you')}</Badge>
                              {/if}
                            </div>
                          </div>
                        </div>
                      {:else}
                        <div class="flex w-2/4 items-start lg:items-center">
                          <Chip value={shortenName(person.email ?? '')} className="mr-3" />
                          <a href={`mailto:${person.email ?? ''}`} class="text-md ui:text-primary mr-2 dark:text-white">
                            {person.email}
                          </a>
                          <div class="flex items-center justify-between">
                            {#if canManageMembers}
                              <Button
                                variant="ghost"
                                size="icon"
                                class="h-8 w-8"
                                onclick={() => copyToClipboard(getEmail(person))}
                              >
                                {#if copiedEmail === getEmail(person)}
                                  <CheckIcon size={16} class="text-green-600" />
                                {:else}
                                  <CopyIcon size={16} />
                                {/if}
                              </Button>
                            {/if}

                            <Chip
                              value={$t('course.navItem.people.pending')}
                              className="bg-yellow-200 text-yellow-700"
                            />
                          </div>
                        </div>
                      {/if}
                    </Table.Cell>

                    <Table.Cell class="w-1/6">
                      <p class="text-center text-base font-normal dark:text-white">
                        {getRoleLabel(Number(person.roleId))}
                      </p>
                    </Table.Cell>

                    <Table.Cell class="w-1/6">
                      <span class="ui:text-muted-foreground text-sm">
                        {person.lastLoginAt ? formatPeopleShortDate(person.lastLoginAt) : '—'}
                      </span>
                    </Table.Cell>

                    <Table.Cell class="w-1/6">
                      <span class="ui:text-muted-foreground text-sm">
                        {formatPeopleShortDate(person.createdAt)}
                      </span>
                    </Table.Cell>

                    <Table.Cell class="w-1/6">
                      {#if canManageMembers && person.profileId !== $profile.id}
                        <div class="hidden space-x-2 sm:flex sm:items-center">
                          <IconButton
                            onclick={() => {
                              memberToDelete = person;
                              isDeleteModalOpen = true;
                            }}
                          >
                            <TrashIcon size={16} />
                          </IconButton>
                        </div>
                      {/if}
                    </Table.Cell>
                  </Table.Row>
                {/each}
              {/if}
            </Table.Body>
          </Table.Root>
        </div>

        {#if peoplePagination && peoplePagination.totalPages > 1}
          <div class="pt-4">
            <TablePagination
              count={peoplePagination.total}
              perPage={peoplePagination.limit}
              page={query.page}
              onPageChange={handlePageChange}
            />
          </div>
        {/if}
      </section>
    {/snippet}
  </Page.Body>
</Page.Root>

<InviteMembersModal
  cohortId={data.cohortId}
  onMembersChanged={() => {
    loadedQueryKey = null;
    loadPeople(data.cohortId, query);
  }}
/>

<Dialog.Root bind:open={isDeleteModalOpen}>
  <Dialog.Content class="w-96 pt-3">
    <Dialog.Header class="px-5 py-2">
      <Dialog.Title>{$t('course.navItem.people.delete_confirmation.title')}</Dialog.Title>
    </Dialog.Header>
    <div>
      <p class="mt-0 text-base dark:text-white">
        {$t('course.navItem.people.delete_confirmation.sure')}
        <strong>{memberToDelete ? getEmail(memberToDelete) : ''}</strong>?
      </p>

      <div class="mt-5 flex items-center justify-between">
        <Button variant="outline" onclick={() => (isDeleteModalOpen = false)}>
          {$t('course.navItem.people.delete_confirmation.no')}
        </Button>
        <Button variant="outline" onclick={deletePerson} loading={cohortApi.isLoading}>
          {$t('course.navItem.people.delete_confirmation.yes')}
        </Button>
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>
