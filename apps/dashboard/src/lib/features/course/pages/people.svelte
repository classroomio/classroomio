<script lang="ts">
  import { page } from '$app/state';
  import { afterNavigate, goto } from '$app/navigation';
  import { Button } from '@cio/ui/base/button';
  import * as Table from '@cio/ui/base/table';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import CopyIcon from '@lucide/svelte/icons/copy';
  import TrashIcon from '@lucide/svelte/icons/trash';
  import CheckIcon from '@lucide/svelte/icons/check';
  import AwardIcon from '@lucide/svelte/icons/award';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import EyeIcon from '@lucide/svelte/icons/eye';
  import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
  import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';

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
  import type {
    CourseMembers,
    CourseMember,
    CourseMembersPagination,
    CoursePeopleView,
    ListPeopleQuery
  } from '$features/course/utils/types';
  import { courseApi } from '$features/course/api';
  import { t } from '$lib/utils/functions/translations';
  import UserIcon from '@lucide/svelte/icons/user';
  import { shortenName } from '$lib/utils/functions/string';
  import { peopleApi } from '$features/course/api';
  import { deleteMemberModal } from '$features/course/components/people/store';
  import { Search } from '@cio/ui/custom/search';
  import { DebouncedSearch } from '$lib/utils/functions/debounced-search.svelte';
  import { snackbar } from '$features/ui/snackbar/store';
  import { onDestroy, untrack } from 'svelte';
  import {
    formatPeopleShortDate,
    getMemberAvatarUrl,
    getMemberProgressPercent,
    getMemberRoleLabel,
    isStudentMember,
    obscureMemberEmail
  } from '$features/course/utils/people-utils';
  import {
    applyPeopleView,
    clearPeopleFilters,
    countActivePeopleFilters,
    getPeopleQueryFromSearchParams,
    getPeopleSearchParams,
    matchPeopleView
  } from '$features/course/utils/people-query-utils';
  import PeopleFilterPopover from '$features/course/components/people/people-filter-popover.svelte';
  import PeopleViewSwitcher from '$features/course/components/people/people-view-switcher.svelte';
  import * as Sheet from '@cio/ui/base/sheet';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Input } from '@cio/ui/base/input';
  import { Textarea } from '@cio/ui/base/textarea';
  import { Label } from '@cio/ui/base/label';
  import { classroomio } from '$lib/utils/services/api';
  import { formatVerifyCode } from '@cio/utils/certificate/verify-code';
  import { resolveCertificateStatus } from '@cio/utils/certificate/certificate-status';
  import { Certificate } from '@cio/ui';
  import { resolveCertificateDesign } from '@cio/certificates';
  import { currentOrg, currentOrgDomain } from '$lib/utils/store/org';
  import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import XIcon from '@lucide/svelte/icons/x';
  import InfoIcon from '@lucide/svelte/icons/info';
  import DownloadIcon from '@lucide/svelte/icons/download';
  import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
  import { CloseIcon, HoverableItem } from '@cio/ui/custom/moving-icons';

  let member: { id?: string; email?: string; profile?: { email: string } } = $state({});
  let copiedEmail = $state<string | null>(null);
  let copiedVerifyCode = $state(false);
  let memberRows = $state<CourseMembers>([]);
  let pagination = $state<CourseMembersPagination | null>(null);
  let isLoadingMembers = $state(false);
  let membersRequestId = 0;
  let loadedQueryKey: string | null = null;
  let certificateDrawerOpen = $state(false);
  let certificateDrawerPerson = $state<CourseMember | null>(null);
  let certificateDetails = $state<{
    certificate: {
      id: string;
      verifyCode: string | null;
      issuedAt: string;
      expiresAt: string | null;
      revokedAt: string | null;
      revokeReason: string | null;
      status: string;
    };
    profile: { id: string; fullname: string | null; email: string | null } | null;
  } | null>(null);
  let isLoadingCertificate = $state(false);
  let revokeDialogOpen = $state(false);
  let revokeReason = $state('');
  let revokeNote = $state('');
  let selectedRevokeReason = $state('');
  let isRevoking = $state(false);

  const REVOKE_REASONS = [
    'Issued by mistake',
    'Assessment not passed',
    'Fraud or policy violation',
    'Learner request',
    'Other'
  ] as const;

  // The URL owns filters, sort and pagination, so a filtered roster is shareable
  // and the browser Back button undoes a filter change.
  const query = $derived(getPeopleQueryFromSearchParams(page.url.searchParams));
  const activeView = $derived(matchPeopleView(query));
  const activeFilterCount = $derived(countActivePeopleFilters(query));

  const search = new DebouncedSearch({
    initial: untrack(() => query.search ?? ''),
    onApply: (nextSearch) => void navigatePeople({ ...query, page: 1, search: nextSearch || undefined })
  });

  async function navigatePeople(nextQuery: ListPeopleQuery) {
    const searchParams = getPeopleSearchParams(nextQuery, page.url.searchParams);
    const nextSearch = searchParams.toString();
    if (nextSearch === page.url.searchParams.toString()) return;

    await goto(`${page.url.pathname}?${nextSearch}`, { keepFocus: true, noScroll: true });
  }

  async function loadMembers(courseId: string, activeQuery: ListPeopleQuery) {
    const requestId = ++membersRequestId;
    isLoadingMembers = true;

    try {
      const response = await peopleApi.list(courseId, activeQuery);
      if (requestId !== membersRequestId) return;

      if (response?.data) {
        memberRows = response.data;
        pagination = response.pagination;
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

  // Reloads when the course or the URL query changes. loadMembers is untracked so
  // the local search box cannot retrigger it on every keystroke.
  $effect(() => {
    const courseId = courseApi.course?.id;
    const activeQuery = query;
    if (!courseId) return;

    const queryKey = `${courseId}:${JSON.stringify(activeQuery)}`;
    if (queryKey === loadedQueryKey) return;

    loadedQueryKey = queryKey;
    isLoadingMembers = true;
    memberRows = [];
    pagination = null;
    untrack(() => void loadMembers(courseId, activeQuery));
  });

  onDestroy(() => {
    search.destroy();
  });

  afterNavigate(() => {
    search.sync(query.search ?? '');
  });

  function refreshCurrentPage() {
    loadedQueryKey = null;
  }

  function handleFilterChange(patch: Partial<ListPeopleQuery>) {
    void navigatePeople({ ...query, ...patch, page: 1, search: search.takePending() || undefined });
  }

  function handleSortChange(sortBy: ListPeopleQuery['sortBy'], sortOrder: ListPeopleQuery['sortOrder']) {
    void navigatePeople({ ...query, sortBy, sortOrder, page: 1, search: search.takePending() || undefined });
  }

  function handlePageChange(nextPage: number) {
    void navigatePeople({ ...query, page: nextPage, search: search.takePending() || undefined });
  }

  function handleSelectView(view: CoursePeopleView) {
    void navigatePeople({ ...applyPeopleView(view, query), search: search.takePending() || undefined });
  }

  function handleClearFilters() {
    void navigatePeople(clearPeopleFilters(query));
  }

  async function openCertificateDrawer(person: CourseMember) {
    if (!person.profileId) return;
    const courseId = courseApi.course?.id;
    if (!courseId) return;
    certificateDrawerPerson = person;
    certificateDetails = null;
    isLoadingCertificate = true;
    certificateDrawerOpen = true;
    try {
      const response = await classroomio.course[':courseId'].certificates[':memberId'].$get(
        { param: { courseId, memberId: person.profileId } },
        {}
      );
      const result = (await response.json()) as {
        success: boolean;
        data?: {
          certificate: {
            id: string;
            verifyCode: string | null;
            issuedAt: string;
            expiresAt: string | null;
            revokedAt: string | null;
            revokeReason: string | null;
            status: string;
          };
        };
      };
      if (result.success && result.data) {
        const cert = (
          result.data as {
            certificate: {
              id: string;
              verifyCode: string | null;
              issuedAt: string;
              expiresAt: string | null;
              revokedAt: string | null;
              revokeReason: string | null;
              status: string;
              metadata: Record<string, unknown> | null;
            };
          }
        ).certificate;
        certificateDetails = {
          certificate: cert as never,
          profile: person.profile
            ? { id: person.profileId!, fullname: person.profile.fullname, email: person.profile.email }
            : null
        } as never;
      } else {
        certificateDetails = null;
      }
    } catch (e) {
      console.error('Failed to load certificate', e);
      snackbar.error('course.navItem.people.snackbar.failed_load_certificate');
    } finally {
      isLoadingCertificate = false;
    }
  }

  function syncMemberRowsCertificate() {
    if (!certificateDetails || !certificateDrawerPerson?.profileId) return;
    const pid = certificateDrawerPerson.profileId;
    const updated = certificateDetails.certificate;
    memberRows = memberRows.map((member) =>
      member.profileId === pid
        ? ({
            ...member,
            certificate: {
              ...((member as unknown as { certificate?: Record<string, unknown> }).certificate ?? {}),
              id: updated.id,
              verifyCode: updated.verifyCode,
              issuedAt: updated.issuedAt,
              expiresAt: updated.expiresAt,
              revokedAt: updated.revokedAt,
              revokeReason: updated.revokeReason
            }
          } as CourseMember)
        : member
    );
  }

  async function handleRevoke() {
    if (!certificateDetails || !certificateDrawerPerson) return;
    const courseId = courseApi.course?.id;
    if (!courseId) return;
    const finalReason = selectedRevokeReason === 'Other' ? revokeNote.trim() : selectedRevokeReason.trim();
    if (!finalReason) {
      snackbar.error('course.navItem.people.snackbar.reason_required');
      return;
    }
    isRevoking = true;
    try {
      const response = await classroomio.course[':courseId'].certificates[':certificateId'].revoke.$post(
        {
          param: { courseId, certificateId: certificateDetails.certificate.id },
          json: { reason: finalReason }
        },
        {}
      );
      const result = (await response.json()) as { success: boolean };
      if (result.success) {
        snackbar.success('course.navItem.people.snackbar.certificate_revoked');
        revokeDialogOpen = false;
        revokeReason = '';
        revokeNote = '';
        selectedRevokeReason = '';
        await openCertificateDrawer(certificateDrawerPerson);
        syncMemberRowsCertificate();
      } else {
        snackbar.error('course.navItem.people.snackbar.failed_revoke');
      }
    } catch (e) {
      console.error(e);
      snackbar.error('course.navItem.people.snackbar.failed_revoke');
    } finally {
      isRevoking = false;
    }
  }

  async function handleReinstate() {
    if (!certificateDetails) return;
    const courseId = courseApi.course?.id;
    if (!courseId) return;
    isRevoking = true;
    try {
      const response = await classroomio.course[':courseId'].certificates[':certificateId'].reinstate.$post(
        { param: { courseId, certificateId: certificateDetails.certificate.id } },
        {}
      );
      const result = (await response.json()) as { success: boolean };
      if (result.success) {
        snackbar.success('course.navItem.people.snackbar.certificate_reinstated');
        if (certificateDrawerPerson) {
          await openCertificateDrawer(certificateDrawerPerson);
          syncMemberRowsCertificate();
        }
      } else {
        snackbar.error('course.navItem.people.snackbar.failed_reinstate');
      }
    } catch (e) {
      console.error(e);
      snackbar.error('course.navItem.people.snackbar.failed_reinstate');
    } finally {
      isRevoking = false;
    }
  }
  // Stage is resolved in TypeScript after pagination, so it has no server sort key.
  const tableColumns: { label: string; sortKey?: ListPeopleQuery['sortBy']; wide?: boolean }[] = $derived([
    { label: $t('course.navItem.people.name'), sortKey: 'name' },
    { label: $t('course.navItem.people.progress'), sortKey: 'progress' },
    { label: $t('course.navItem.people.stage'), wide: true },
    { label: $t('course.navItem.people.certificate') },
    { label: $t('course.navItem.people.last_login_at'), sortKey: 'lastLogin' },
    { label: $t('course.navItem.people.enrolled_at'), sortKey: 'enrolledAt' }
  ]);

  function handleSortByHeader(sortBy: ListPeopleQuery['sortBy']) {
    const sortOrder = query.sortBy === sortBy && query.sortOrder === 'asc' ? 'desc' : 'asc';
    handleSortChange(sortBy, sortOrder);
  }

  async function deletePerson() {
    const courseId = courseApi.course?.id;
    if (!member.id || !courseId) return;

    await peopleApi.delete(courseId, member.id);

    if (peopleApi.success) {
      memberRows = memberRows.filter((person) => person.id !== member.id);
      courseApi.group.people = courseApi.group.people.filter((person: { id: string }) => person.id !== member.id);
      courseApi.group.tutors = courseApi.group.tutors.filter((person: CourseMember) => person.id !== member.id);

      const nextPage = memberRows.length === 0 && query.page > 1 ? query.page - 1 : query.page;
      await navigatePeople({ ...query, page: nextPage, search: search.takePending() || undefined });
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

  async function copyVerifyCode(code: string) {
    console.log('Trying to copy:', code);
    try {
      await navigator.clipboard.writeText(code);
      copiedVerifyCode = true;
      setTimeout(() => {
        copiedVerifyCode = false;
      }, 1500);
    } catch (err) {
      console.error('Failed to copy verify code:', err);
    }
  }
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
      value={search.draft}
      onValueChange={(nextValue) => search.input(nextValue)}
    />
    <PeopleFilterPopover
      {query}
      {activeFilterCount}
      isLoading={isLoadingMembers}
      onFilterChange={handleFilterChange}
      onClearFilters={handleClearFilters}
      onSortChange={handleSortChange}
    />
  </div>

  <div class="overflow-x-auto rounded-md border">
    <Tooltip.Provider>
      <Table.Root class="min-w-[880px]">
        <Table.Header>
          <Table.Row>
            {#each tableColumns as column (column.label)}
              <Table.Head
                class={column.wide ? 'max-w-[220px]' : undefined}
                aria-sort={column.sortKey
                  ? query.sortBy === column.sortKey
                    ? query.sortOrder === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                  : undefined}
              >
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
            <Table.Head class={stickyActionsHeadClass}></Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#if isLoadingMembers && memberRows.length === 0}
            <Table.Row>
              <Table.Cell colspan={7} class="ui:text-muted-foreground py-8 text-center text-sm">
                {$t('course.navItem.people.invite_modal.loading')}
              </Table.Cell>
            </Table.Row>
          {:else if memberRows.length === 0}
            <Table.Row>
              <Table.Cell colspan={7} class="ui:text-muted-foreground py-8 text-center text-sm">
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
                  {@const roleLabel = getMemberRoleLabel(person)}
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
                          <p class="flex items-center gap-1.5 text-base font-normal dark:text-white">
                            <span class="truncate">{person.profile.fullname}</span>
                            {#if roleLabel}
                              <Badge variant="secondary" class="shrink-0 px-1.5 py-0 text-[10px] leading-4 font-medium">
                                {$t(roleLabel)}
                              </Badge>
                            {/if}
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
                      {#if roleLabel}
                        <Badge variant="secondary" class="mr-2 shrink-0 px-1.5 py-0 text-[10px] leading-4 font-medium">
                          {$t(roleLabel)}
                        </Badge>
                      {/if}
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

                <Table.Cell class="min-w-[130px]">
                  {#if person.profileId && person.stage?.kind === 'certificate_earned'}
                    {@const cert = (
                      person as unknown as {
                        certificate?: { verifyCode: string | null; revokedAt: string | null; expiresAt: string | null };
                      }
                    ).certificate}
                    {@const certStatus = cert
                      ? resolveCertificateStatus({ revokedAt: cert.revokedAt, expiresAt: cert.expiresAt })
                      : 'valid'}
                    <button
                      type="button"
                      class="focus-visible:ring-ring rounded-full focus-visible:ring-2 focus-visible:outline-none"
                      aria-label={$t('course.navItem.people.certificate_drawer.open_certificate_for', {
                        name: person.profile?.fullname ?? getEmail(person) ?? ''
                      })}
                      onclick={(event) => {
                        event.stopPropagation();
                        void openCertificateDrawer(person);
                      }}
                    >
                      {#if certStatus === 'valid'}
                        <Badge
                          variant="outline"
                          class="cursor-pointer border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
                          >{$t('course.navItem.people.certificate_drawer.status_valid')}</Badge
                        >
                      {:else if certStatus === 'expired'}
                        <Badge
                          variant="outline"
                          class="cursor-pointer border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
                          >{$t('course.navItem.people.certificate_drawer.status_expired')}</Badge
                        >
                      {:else}
                        <Badge variant="destructive" class="cursor-pointer"
                          >{$t('course.navItem.people.certificate_drawer.status_revoked')}</Badge
                        >
                      {/if}
                    </button>
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
                          {#if person.profileId && person.stage?.kind === 'certificate_earned'}
                            <DropdownMenu.Item
                              onclick={(event) => {
                                event.stopPropagation();
                                void openCertificateDrawer(person);
                              }}
                            >
                              <AwardIcon class="mr-2 size-4" />
                              {$t('course.navItem.people.certificate_drawer.dropdown_certificate')}
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
        page={query.page}
        onPageChange={handlePageChange}
      />
    </div>
  {/if}
</section>

<Sheet.Root bind:open={certificateDrawerOpen}>
  <Sheet.Content hideClose class="flex flex-col overflow-hidden p-0 sm:max-w-[580px]">
    <div class="sticky top-0 z-10 flex shrink-0 items-start gap-3 border-b bg-white px-6 py-4">
      <div class="bg-muted flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-medium">
        {certificateDrawerPerson?.profile?.fullname?.charAt(0) ?? certificateDrawerPerson?.email?.charAt(0) ?? '?'}
      </div>
      <div class="min-w-0 flex-1">
        <h2 class="truncate text-base font-semibold">
          {certificateDrawerPerson?.profile?.fullname ?? certificateDrawerPerson?.email ?? 'Learner'}
        </h2>
        <p class="text-muted-foreground truncate text-sm">
          {certificateDrawerPerson ? obscureMemberEmail(getEmail(certificateDrawerPerson)) : ''}
        </p>
      </div>
      <div class="mr-5 flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          class="size-7"
          onclick={() => {
            const idx = memberRows.findIndex((m) => m.id === certificateDrawerPerson?.id);
            const list = memberRows.filter((m) => m.stage?.kind === 'certificate_earned');
            const currentIdx = list.findIndex((m) => m.id === certificateDrawerPerson?.id);
            if (currentIdx > 0) void openCertificateDrawer(list[currentIdx - 1]);
          }}
          disabled={memberRows
            .filter((m) => m.stage?.kind === 'certificate_earned')
            .findIndex((m) => m.id === certificateDrawerPerson?.id) <= 0}
        >
          <ChevronLeftIcon class="size-4" />
        </Button>
        <span class="min-w-[60px] text-center text-xs tabular-nums">
          {(() => {
            const list = memberRows.filter((m) => m.stage?.kind === 'certificate_earned');
            const idx = list.findIndex((m) => m.id === certificateDrawerPerson?.id);
            return list.length ? `${idx + 1} of ${list.length}` : '';
          })()}
        </span>
        <Button
          variant="ghost"
          size="icon"
          class="size-7"
          onclick={() => {
            const list = memberRows.filter((m) => m.stage?.kind === 'certificate_earned');
            const idx = list.findIndex((m) => m.id === certificateDrawerPerson?.id);
            if (idx >= 0 && idx < list.length - 1) void openCertificateDrawer(list[idx + 1]);
          }}
          disabled={(() => {
            const list = memberRows.filter((m) => m.stage?.kind === 'certificate_earned');
            const idx = list.findIndex((m) => m.id === certificateDrawerPerson?.id);
            return idx < 0 || idx >= list.length - 1;
          })()}
        >
          <ChevronRightIcon class="size-4" />
        </Button>
      </div>
      <HoverableItem>
        {#snippet children(isHovered)}
          <button
            class="ui:ring-offset-background ui:focus-visible:ring-ring ui:rounded-xs ui:focus-visible:outline-hidden ui:opacity-70 ui:transition-opacity ui:hover:opacity-100 ui:focus-visible:ring-2 ui:focus-visible:ring-offset-2 flex size-7 shrink-0 items-center justify-center"
            aria-label="Close"
            onclick={() => (certificateDrawerOpen = false)}
          >
            <CloseIcon {isHovered} />
          </button>
        {/snippet}
      </HoverableItem>
    </div>
    <div class="flex-1 space-y-6 overflow-y-auto px-4 pt-4">
      {#if isLoadingCertificate}
        <p class="text-muted-foreground text-sm">{$t('course.navItem.people.certificate_drawer.loading')}</p>
      {:else if !certificateDetails}
        <p class="text-muted-foreground text-sm">{$t('course.navItem.people.certificate_drawer.empty')}</p>
      {:else}
        {@const cert = certificateDetails.certificate}
        {@const status = resolveCertificateStatus({ revokedAt: cert.revokedAt, expiresAt: cert.expiresAt })}
        {@const design = resolveCertificateDesign(courseApi.course?.certificate)}
        {@const verifyCode = cert.verifyCode ? formatVerifyCode(cert.verifyCode) : null}
        {@const verifyUrl = cert.verifyCode
          ? `${($currentOrgDomain || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, '')}/verify?code=${encodeURIComponent(formatVerifyCode(cert.verifyCode))}`
          : null}
        <div class="ui:border-border ui:bg-muted w-full rounded-md border p-3">
          <div
            class="relative w-full overflow-hidden rounded-lg border bg-white shadow-sm"
            style:opacity={status === 'revoked' ? '0.62' : status === 'expired' ? '0.85' : '1'}
            style:filter={status === 'revoked' ? 'grayscale(1)' : 'none'}
          >
            <div class="aspect-[1100/780] w-full">
              <Certificate.Preview
                {design}
                data={{
                  recipientName:
                    certificateDetails.profile?.fullname ?? certificateDrawerPerson?.profile?.fullname ?? 'Learner',
                  courseName: courseApi.course?.title ?? '',
                  courseDescription: design.descriptionOverride || courseApi.course?.description || '',
                  orgName: $currentOrg.name || '',
                  orgLogoUrl: $currentOrg.avatarUrl || undefined,
                  date: new Date(cert.issuedAt).toLocaleDateString(),
                  certificateId: cert.verifyCode ? `N° ${cert.verifyCode.slice(-4)}` : 'N° 0000',
                  verifyCode,
                  verifyUrl
                }}
              />
            </div>
            {#if status === 'revoked'}
              <div class="pointer-events-none absolute inset-0 grid place-items-center">
                <span
                  class="border-destructive text-destructive rotate-[-12deg] rounded-md border-4 bg-white/80 px-4 py-1 text-2xl font-extrabold tracking-widest uppercase opacity-80 backdrop-blur-sm"
                  >{$t('course.navItem.people.certificate_drawer.status_revoked')}</span
                >
              </div>
            {:else if status === 'expired'}
              <div class="pointer-events-none absolute inset-0 grid place-items-center">
                <span
                  class="rotate-[-12deg] rounded-md border-4 border-amber-600 bg-white/80 px-4 py-1 text-2xl font-extrabold tracking-widest text-amber-600 opacity-80 backdrop-blur-sm"
                  >{$t('course.navItem.people.certificate_drawer.status_expired')}</span
                >
              </div>
            {/if}
          </div>
          <p class="text-muted-foreground mt-2 text-left text-xs">
            {$t('course.navItem.people.certificate_drawer.as_learner_sees')}
          </p>
        </div>

        <div class="space-y-4">
          <h3 class="text-xs font-semibold tracking-wider uppercase">
            {$t('course.navItem.people.certificate_drawer.heading')}
          </h3>
          <dl class="grid grid-cols-[120px_1fr] gap-x-3 gap-y-2 text-sm">
            <dt class="text-muted-foreground">{$t('course.navItem.people.certificate_drawer.status')}</dt>
            <dd>
              {#if status === 'valid'}<Badge class="border-emerald-200 bg-emerald-50 text-emerald-700"
                  >{$t('course.navItem.people.certificate_drawer.status_valid')}</Badge
                >{:else if status === 'expired'}<Badge class="border-amber-200 bg-amber-50 text-amber-700"
                  >{$t('course.navItem.people.certificate_drawer.status_expired')}</Badge
                >{:else}<Badge variant="destructive"
                  >{$t('course.navItem.people.certificate_drawer.status_revoked')}</Badge
                >{/if}
            </dd>
            <dt class="text-muted-foreground">{$t('course.navItem.people.certificate_drawer.code')}</dt>
            <dd class="flex items-center gap-2 font-mono font-semibold tracking-wider">
              {verifyCode ?? '—'}
              {#if verifyCode}
                <Tooltip.Provider>
                  <Tooltip.Root>
                    <Tooltip.Trigger>
                      {#snippet child({ props })}
                        <Button
                          variant="ghost"
                          size="icon"
                          class="size-7 shrink-0"
                          aria-label={copiedVerifyCode
                            ? $t('course.navItem.people.certificate_drawer.copied')
                            : $t('course.navItem.people.certificate_drawer.copy_code')}
                          onclick={() => copyVerifyCode(verifyCode!)}
                          {...props}
                        >
                          {#if copiedVerifyCode}
                            <CheckIcon class="size-3.5 text-emerald-600" />
                          {:else}
                            <CopyIcon class="size-3.5" />
                          {/if}
                        </Button>
                      {/snippet}
                    </Tooltip.Trigger>
                    <Tooltip.Content side="top"
                      >{copiedVerifyCode
                        ? $t('course.navItem.people.certificate_drawer.copied')
                        : $t('course.navItem.people.certificate_drawer.copy_code')}</Tooltip.Content
                    >
                  </Tooltip.Root>
                </Tooltip.Provider>
              {/if}
            </dd>
            <dt class="text-muted-foreground">{$t('course.navItem.people.certificate_drawer.issued')}</dt>
            <dd>{new Date(cert.issuedAt).toLocaleDateString()}</dd>
            <dt class="text-muted-foreground">{$t('course.navItem.people.certificate_drawer.expires')}</dt>
            <dd>
              {cert.expiresAt
                ? new Date(cert.expiresAt).toLocaleDateString()
                : $t('course.navItem.people.certificate_drawer.does_not_expire')}
            </dd>
          </dl>
        </div>

        {#if cert.revokedAt}
          <div class="space-y-4 border-t pt-4">
            <h3 class="text-xs font-semibold tracking-wider uppercase">
              {$t('course.navItem.people.certificate_drawer.revocation')}
            </h3>
            <dl class="grid grid-cols-[120px_1fr] gap-x-3 gap-y-2 text-sm">
              <dt class="text-muted-foreground">
                {$t('course.navItem.people.certificate_drawer.revoked_by')}
              </dt>
              <dd>{$t('course.navItem.people.certificate_drawer.revoked_by_system')}</dd>
              <dt class="text-muted-foreground">{$t('course.navItem.people.certificate_drawer.on')}</dt>
              <dd>{new Date(cert.revokedAt).toLocaleDateString()}</dd>
              {#if cert.revokeReason}<dt class="text-muted-foreground">
                  {$t('course.navItem.people.certificate_drawer.reason')}
                </dt>
                <dd>{cert.revokeReason}</dd>{/if}
            </dl>
          </div>
        {/if}

        <div class="space-y-3 border-t pt-4">
          <h3 class="text-xs font-semibold tracking-wider uppercase">
            {$t('course.navItem.people.certificate_drawer.activity')}
          </h3>
          <ul class="space-y-3">
            {#if cert.revokedAt}
              <li class="flex gap-3">
                <span class="bg-destructive/10 text-destructive flex size-6 items-center justify-center rounded-full"
                  >✕</span
                >
                <div>
                  <p class="text-sm font-medium">
                    {$t('course.navItem.people.certificate_drawer.activity_revoked')}
                  </p>
                  <p class="text-muted-foreground text-xs">
                    {cert.revokeReason ?? ''} · {new Date(cert.revokedAt).toLocaleDateString()}
                  </p>
                </div>
              </li>
            {/if}
            <li class="flex gap-3">
              <span class="flex size-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">✓</span>
              <div>
                <p class="text-sm font-medium">
                  {$t('course.navItem.people.certificate_drawer.activity_issued')}
                </p>
                <p class="text-muted-foreground text-xs">
                  {$t('course.navItem.people.certificate_drawer.activity_issued_desc', {
                    date: new Date(cert.issuedAt).toLocaleDateString()
                  })}
                </p>
              </div>
            </li>
            <li class="flex gap-3">
              <span class="bg-muted text-muted-foreground flex size-6 items-center justify-center rounded-full">•</span>
              <div>
                <p class="text-sm font-medium">
                  {$t('course.navItem.people.certificate_drawer.activity_completed')}
                </p>
                <p class="text-muted-foreground text-xs">
                  {certificateDetails.profile?.fullname ?? ''} · {new Date(cert.issuedAt).toLocaleDateString()}
                </p>
              </div>
            </li>
          </ul>
        </div>

        <div class="sticky bottom-0 z-10 -mx-4 -mb-4 flex justify-end gap-2 border-t bg-white px-4 py-3">
          {#if status !== 'revoked'}
            <Button
              variant="destructive"
              size="sm"
              onclick={() => {
                selectedRevokeReason = '';
                revokeNote = '';
                revokeDialogOpen = true;
              }}>{$t('course.navItem.people.certificate_drawer.revoke')}</Button
            >
          {:else}
            <Button variant="outline" size="sm" onclick={handleReinstate} disabled={isRevoking}
              >{$t('course.navItem.people.certificate_drawer.reinstate')}</Button
            >
          {/if}
          <Button variant="outline" size="sm" onclick={() => (certificateDrawerOpen = false)}
            >{$t('course.navItem.people.certificate_drawer.close')}</Button
          >
        </div>
      {/if}
    </div>
  </Sheet.Content>
</Sheet.Root>

<Dialog.Root bind:open={revokeDialogOpen}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>{$t('course.navItem.people.certificate_drawer.dialog_title')}</Dialog.Title>
      <Dialog.Description>{$t('course.navItem.people.certificate_drawer.dialog_description')}</Dialog.Description>
    </Dialog.Header>
    <div class="space-y-4 py-2">
      <div>
        <Label>{$t('course.navItem.people.certificate_drawer.reason_label')}</Label>
        <div class="mt-2 flex flex-wrap gap-2">
          {#each REVOKE_REASONS as reason (reason)}
            <Button
              variant={selectedRevokeReason === reason ? 'default' : 'outline'}
              size="sm"
              class="rounded-full shadow-none"
              onclick={() => {
                selectedRevokeReason = reason;
                if (reason !== 'Other') revokeNote = '';
              }}
            >
              {reason}
            </Button>
          {/each}
        </div>
      </div>
      {#if selectedRevokeReason === 'Other'}
        <div>
          <Label for="revoke-note">{$t('course.navItem.people.certificate_drawer.note_label')}</Label>
          <Textarea
            id="revoke-note"
            bind:value={revokeNote}
            rows={3}
            placeholder={$t('course.navItem.people.certificate_drawer.note_placeholder')}
            class="mt-2 max-h-60 min-h-20"
          />
        </div>
      {/if}
      <ul class="ui:border-border ui:text-muted-foreground space-y-2.5 border-t pt-4 text-[13px]">
        <li class="flex items-start gap-2">
          <InfoIcon class="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>{$t('course.navItem.people.certificate_drawer.bullet_revoked_public')}</span>
        </li>
        <li class="flex items-start gap-2">
          <DownloadIcon class="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>{$t('course.navItem.people.certificate_drawer.bullet_no_download')}</span>
        </li>
        <li class="flex items-start gap-2">
          <RotateCcwIcon class="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>{$t('course.navItem.people.certificate_drawer.bullet_reinstate')}</span>
        </li>
      </ul>
    </div>
    <Dialog.Footer>
      <Button
        variant="outline"
        onclick={() => {
          revokeDialogOpen = false;
          selectedRevokeReason = '';
          revokeNote = '';
        }}>{$t('course.navItem.people.certificate_drawer.cancel')}</Button
      >
      <Button
        variant="destructive"
        onclick={handleRevoke}
        disabled={isRevoking || !selectedRevokeReason || (selectedRevokeReason === 'Other' && !revokeNote.trim())}
        loading={isRevoking}>{$t('course.navItem.people.certificate_drawer.confirm_revoke')}</Button
      >
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
