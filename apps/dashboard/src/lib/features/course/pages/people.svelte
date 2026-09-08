<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { Button } from '@cio/ui/base/button';
  import * as Table from '@cio/ui/base/table';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import CopyIcon from '@lucide/svelte/icons/copy';
  import TrashIcon from '@lucide/svelte/icons/trash';
  import CheckIcon from '@lucide/svelte/icons/check';
  import AwardIcon from '@lucide/svelte/icons/award';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import EyeIcon from '@lucide/svelte/icons/eye';

  import { Chip } from '@cio/ui/custom/chip';
  import * as Avatar from '@cio/ui/base/avatar';
  import { Badge } from '@cio/ui/base/badge';
  import { Progress } from '@cio/ui/base/progress';
  import * as Tooltip from '@cio/ui/base/tooltip';
  import { ComingSoon, RoleBasedSecurity, TablePagination, UpgradeBanner } from '$features/ui';
  import TruncatedWithTooltip from '$features/course/components/truncated-with-tooltip.svelte';
  import InvitationModal from '$features/course/components/people/invitation-modal.svelte';
  import GrantAccessModal from '$features/course/components/people/grant-access-modal.svelte';
  import DeleteConfirmation from '$features/course/components/people/delete-confirmation.svelte';
  import { isStudentLimitReached } from '$lib/utils/store/org';

  import { profile } from '$lib/utils/store/user';
  import type { CourseMembers, CourseMember, CourseMembersPagination } from '$features/course/utils/types';
  import { courseApi } from '$features/course/api';
  import { t } from '$lib/utils/functions/translations';
  import UserIcon from '@lucide/svelte/icons/user';
  import { shortenName } from '$lib/utils/functions/string';
  import * as Select from '@cio/ui/base/select';
  import { ROLE_LABEL, ROLES } from '$lib/utils/constants/roles';
  import { peopleApi } from '$features/course/api';
  import { deleteMemberModal } from '$features/course/components/people/store';
  import { Search } from '@cio/ui/custom/search';
  import { snackbar } from '$features/ui/snackbar/store';
  import { onDestroy, untrack } from 'svelte';
  import {
    ALL_ROLES_FILTER,
    DEFAULT_PEOPLE_PAGE_SIZE,
    formatPeopleShortDate,
    getMemberAvatarUrl,
    getMemberProgressPercent,
    isStudentMember,
    obscureMemberEmail
  } from '$features/course/utils/people-utils';

  let member: { id?: string; email?: string; profile?: { email: string } } = $state({});
  let filterBy: string = $state(`${ROLES[0].value}`);
  let searchValue = $state('');
  let copiedEmail = $state<string | null>(null);
  let memberRows = $state<CourseMembers>([]);
  let pagination = $state<CourseMembersPagination | null>(null);
  let currentPage = $state(1);
  let isLoadingMembers = $state(false);
  let membersRequestId = 0;
  let searchDebounceTimeout: ReturnType<typeof setTimeout> | null = null;
  let loadedCourseId: string | null = null;

  async function loadMembers(courseId: string, page: number) {
    const requestId = ++membersRequestId;
    isLoadingMembers = true;

    try {
      const roleId = filterBy === ALL_ROLES_FILTER ? undefined : Number(filterBy);
      const response = await peopleApi.list(courseId, {
        page,
        limit: DEFAULT_PEOPLE_PAGE_SIZE,
        search: searchValue.trim() || undefined,
        roleId
      });
      if (requestId !== membersRequestId) return;

      if (response?.data) {
        memberRows = response.data;
        pagination = response.pagination;
        currentPage = response.pagination.page;
      }
    } catch (error) {
      console.error('Failed to load course members:', error);
      if (requestId === membersRequestId) {
        snackbar.error('snackbar.something');
      }
    } finally {
      if (requestId === membersRequestId) {
        isLoadingMembers = false;
      }
    }
  }

  // Only the course id should retrigger a load; the search and role filter reads inside
  // loadMembers would otherwise make this effect refetch on every keystroke.
  $effect(() => {
    const courseId = courseApi.course?.id;
    if (!courseId || courseId === loadedCourseId) return;

    loadedCourseId = courseId;
    untrack(() => reloadFirstPage());
  });

  onDestroy(() => {
    if (searchDebounceTimeout) {
      clearTimeout(searchDebounceTimeout);
    }
  });

  function reloadFirstPage() {
    const courseId = courseApi.course?.id;
    if (!courseId) return;

    currentPage = 1;
    void loadMembers(courseId, 1);
  }

  function refreshCurrentPage() {
    const courseId = courseApi.course?.id;
    if (!courseId) return;

    void loadMembers(courseId, currentPage);
  }

  function handleSearchValueChange(value: string) {
    searchValue = value;

    if (searchDebounceTimeout) {
      clearTimeout(searchDebounceTimeout);
    }

    searchDebounceTimeout = setTimeout(reloadFirstPage, 300);
  }

  function handleRoleChange(value: string) {
    filterBy = value;
    reloadFirstPage();
  }

  function handlePageChange(page: number) {
    const courseId = courseApi.course?.id;
    if (!courseId) return;

    currentPage = page;
    void loadMembers(courseId, page);
  }

  async function deletePerson() {
    const courseId = courseApi.course?.id;
    if (!member.id || !courseId) return;

    await peopleApi.delete(courseId, member.id);

    if (peopleApi.success) {
      memberRows = memberRows.filter((person) => person.id !== member.id);
      courseApi.group.people = courseApi.group.people.filter((person: { id: string }) => person.id !== member.id);
      courseApi.group.tutors = courseApi.group.tutors.filter((person: CourseMember) => person.id !== member.id);

      const nextPage = memberRows.length === 0 && currentPage > 1 ? currentPage - 1 : currentPage;
      currentPage = nextPage;
      await loadMembers(courseId, nextPage);
    }
  }

  function getEmail(person: CourseMember) {
    const { profile, email } = person;

    return profile ? profile.email : email;
  }

  function gotoPerson(person: CourseMember) {
    if (!person.profileId) return;

    goto(`${page.url.href}/${person.profileId}`);
  }

  function shouldIgnoreRowNavigation(event: Event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return false;

    return Boolean(
      target.closest('button, a, [data-slot="dropdown-menu-trigger"], [data-slot="dropdown-menu-content"]')
    );
  }

  function handleRowClick(person: CourseMember, event: MouseEvent) {
    if (!person.profileId || shouldIgnoreRowNavigation(event)) return;

    gotoPerson(person);
  }

  function handleRowKeydown(person: CourseMember, event: KeyboardEvent) {
    if (!person.profileId || shouldIgnoreRowNavigation(event)) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;

    event.preventDefault();
    gotoPerson(person);
  }

  const navigableRowClass =
    'group cursor-pointer ui:hover:[&>td]:!ui:bg-secondary/80 focus-visible:[&>td]:ui:bg-secondary/80';
  const stickyActionsHeadClass =
    'ui:bg-muted/95 sticky right-0 z-20 w-12 border-l ui:border-border shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.08)]';
  const stickyActionsCellClass =
    'ui:bg-card group-hover:ui:bg-secondary/80 sticky right-0 z-10 w-12 border-l ui:border-border text-right shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.08)] transition-colors';

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      copiedEmail = text;
      setTimeout(() => {
        copiedEmail = null;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  const selectOptions = $derived(ROLES.map((role) => ({ label: $t(role.label), value: `${role.value}` })));
</script>

<InvitationModal onMembersChanged={refreshCurrentPage} />
<GrantAccessModal onMembersChanged={refreshCurrentPage} />

{#if $isStudentLimitReached}
  <UpgradeBanner className="mb-2">{$t('course.navItem.people.invite_modal.student_limit_reached')}</UpgradeBanner>
{/if}

<DeleteConfirmation email={member.email || (member.profile && member.profile.email)} {deletePerson} />

<section class="space-y-2">
  <div class="flex flex-col items-center justify-end gap-2 md:flex-row">
    <Search
      placeholder={$t('course.navItem.people.search')}
      bind:value={searchValue}
      onValueChange={handleSearchValueChange}
    />
    <Select.Root type="single" name="roles" bind:value={filterBy} onValueChange={handleRoleChange}>
      <Select.Trigger class="max-w-[80px]">
        {$t(ROLE_LABEL[Number(filterBy)])}
      </Select.Trigger>
      <Select.Content>
        <Select.Group>
          {#each selectOptions as option (option.value)}
            <Select.Item value={option.value} label={option.label} disabled={option.value === filterBy}>
              {option.label}
            </Select.Item>
          {/each}
        </Select.Group>
      </Select.Content>
    </Select.Root>
  </div>

  <div class="overflow-x-auto rounded-md border">
    <Tooltip.Provider>
      <Table.Root class="min-w-[880px]">
        <Table.Header>
          <Table.Row>
            <Table.Head>{$t('course.navItem.people.learner')}</Table.Head>
            <Table.Head>{$t('course.navItem.people.progress')}</Table.Head>
            <Table.Head class="max-w-[220px]">{$t('course.navItem.people.stage')}</Table.Head>
            <Table.Head>{$t('course.navItem.people.last_login_at')}</Table.Head>
            <Table.Head>{$t('course.navItem.people.enrolled_at')}</Table.Head>
            <Table.Head class={stickyActionsHeadClass}></Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#if isLoadingMembers && memberRows.length === 0}
            <Table.Row>
              <Table.Cell colspan={6} class="ui:text-muted-foreground py-8 text-center text-sm">
                {$t('course.navItem.people.invite_modal.loading')}
              </Table.Cell>
            </Table.Row>
          {:else if memberRows.length === 0}
            <Table.Row>
              <Table.Cell colspan={6} class="ui:text-muted-foreground py-8 text-center text-sm">
                {$t('course.search.empty')}
              </Table.Cell>
            </Table.Row>
          {:else}
            {#each memberRows as person (person.id)}
              <Table.Row
                class={person.profileId ? navigableRowClass : 'group'}
                tabindex={person.profileId ? 0 : undefined}
                onclick={(event) => handleRowClick(person, event)}
                onkeydown={(event) => handleRowKeydown(person, event)}
              >
                <Table.Cell class="min-w-[220px]">
                  {#if person.profile}
                    <div class="flex items-start lg:items-center">
                      <Avatar.Root class="mr-3">
                        {#if getMemberAvatarUrl(person)}
                          <Avatar.Image
                            src={getMemberAvatarUrl(person)}
                            alt={person.profile.fullname ? person.profile.fullname : 'User'}
                          />
                        {/if}
                        <Avatar.Fallback>
                          <UserIcon class="ui:size-4 ui:text-muted-foreground" />
                        </Avatar.Fallback>
                      </Avatar.Root>
                      <div class="flex flex-col items-start lg:flex-row lg:items-center">
                        <div class="mr-2">
                          <p class="text-base font-normal dark:text-white">
                            {person.profile.fullname}
                          </p>
                          <p class="ui:text-primary line-clamp-1 text-xs">
                            {obscureMemberEmail(getEmail(person))}
                          </p>
                        </div>
                        <div class="flex items-center">
                          <RoleBasedSecurity allowedRoles={[1, 2]}>
                            <Button
                              variant="secondary"
                              size="icon"
                              class="h-8 w-8 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
                              onclick={(event) => {
                                event.stopPropagation();
                                void copyToClipboard(getEmail(person) ?? '');
                              }}
                            >
                              {#if copiedEmail === getEmail(person)}
                                <CheckIcon size={16} class="text-green-600" />
                              {:else}
                                <CopyIcon size={16} />
                              {/if}
                            </Button>
                          </RoleBasedSecurity>
                          {#if person.profileId == $profile.id}
                            <ComingSoon label={$t('course.navItem.people.you')} />
                          {/if}
                        </div>
                      </div>
                    </div>
                  {:else}
                    <div class="flex w-2/4 items-start lg:items-center">
                      <Chip value={shortenName(person.email)} className="mr-3" />
                      <a href="mailto:{person.email}" class="text-md ui:text-primary mr-2 dark:text-white">
                        {person.email}
                      </a>
                      <div class="flex items-center justify-between">
                        <RoleBasedSecurity allowedRoles={[1, 2]}>
                          <Button
                            variant="secondary"
                            size="icon"
                            class="h-8 w-8 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
                            onclick={(event) => {
                              event.stopPropagation();
                              void copyToClipboard(getEmail(person) ?? '');
                            }}
                          >
                            {#if copiedEmail === getEmail(person)}
                              <CheckIcon size={16} class="text-green-600" />
                            {:else}
                              <CopyIcon size={16} />
                            {/if}
                          </Button>
                        </RoleBasedSecurity>

                        <Chip value={$t('course.navItem.people.pending')} className="bg-yellow-200 text-yellow-700" />
                      </div>
                    </div>
                  {/if}
                </Table.Cell>

                <Table.Cell class="min-w-[140px]">
                  {#if isStudentMember(person)}
                    {@const progressPercent = getMemberProgressPercent(person) ?? 0}
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
                  {#if isStudentMember(person) && person.stage}
                    {#if person.stage.kind === 'certificate_earned'}
                      <Badge
                        variant="outline"
                        class="max-w-[200px] border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
                      >
                        <div class="flex min-w-0 items-center gap-1">
                          <AwardIcon class="size-3.5 shrink-0" />
                          <TruncatedWithTooltip
                            text={$t('course.navItem.people.certificate_earned')}
                            maxWidth="100%"
                            class="text-emerald-700 dark:text-emerald-300"
                          />
                        </div>
                      </Badge>
                    {:else if person.stage.kind === 'not_started'}
                      <Badge variant="outline" class="ui:bg-muted ui:text-muted-foreground max-w-[200px]">
                        <TruncatedWithTooltip
                          text={$t('course.navItem.people.not_started')}
                          maxWidth="100%"
                          class="ui:text-muted-foreground"
                        />
                      </Badge>
                    {:else}
                      <div class="flex max-w-[220px] items-center gap-2">
                        <span
                          class="ui:bg-primary/10 ui:text-primary flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                        >
                          {person.stage.position}
                        </span>
                        <div class="min-w-0 flex-1">
                          <TruncatedWithTooltip
                            text={person.stage.title}
                            maxWidth="100%"
                            class="ui:text-foreground text-sm font-medium"
                          />
                        </div>
                      </div>
                    {/if}
                  {:else}
                    <span class="ui:text-muted-foreground text-sm">—</span>
                  {/if}
                </Table.Cell>

                <Table.Cell class="min-w-[110px]">
                  {#if isStudentMember(person)}
                    <span class="ui:text-muted-foreground text-sm">
                      {formatPeopleShortDate(person.lastLoginAt)}
                    </span>
                  {:else}
                    <span class="ui:text-muted-foreground text-sm">—</span>
                  {/if}
                </Table.Cell>

                <Table.Cell class="min-w-[110px]">
                  <span class="ui:text-muted-foreground text-sm">
                    {formatPeopleShortDate(person.enrolledAt ?? person.createdAt)}
                  </span>
                </Table.Cell>

                <Table.Cell class={stickyActionsCellClass}>
                  <RoleBasedSecurity allowedRoles={[1, 2]}>
                    {#if person.profileId !== $profile.id}
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger
                          class="ui:hover:bg-muted flex items-center justify-center rounded-md p-1"
                          onclick={(event) => event.stopPropagation()}
                        >
                          <EllipsisVerticalIcon size={16} />
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content align="end">
                          {#if person.profileId}
                            <DropdownMenu.Item
                              onclick={(event) => {
                                event.stopPropagation();
                                gotoPerson(person);
                              }}
                            >
                              <EyeIcon class="mr-2 size-4" />
                              {$t('course.navItem.people.view')}
                            </DropdownMenu.Item>
                          {/if}
                          <DropdownMenu.Item
                            class="text-red-600"
                            onclick={(event) => {
                              event.stopPropagation();
                              member = person;
                              $deleteMemberModal.open = true;
                            }}
                          >
                            <TrashIcon class="mr-2 size-4" />
                            {$t('course.navItem.people.delete_profile')}
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Root>
                    {/if}
                  </RoleBasedSecurity>
                </Table.Cell>
              </Table.Row>
            {/each}
          {/if}
        </Table.Body>
      </Table.Root>
    </Tooltip.Provider>
  </div>

  {#if pagination && pagination.totalPages > 1}
    <div class="pt-4">
      <TablePagination
        count={pagination.total}
        perPage={pagination.limit}
        page={currentPage}
        onPageChange={handlePageChange}
      />
    </div>
  {/if}
</section>
