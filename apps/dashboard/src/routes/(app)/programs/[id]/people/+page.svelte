<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import * as Avatar from '@cio/ui/base/avatar';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import * as Dialog from '@cio/ui/base/dialog';
  import * as Page from '@cio/ui/base/page';
  import * as Select from '@cio/ui/base/select';
  import * as Table from '@cio/ui/base/table';
  import { Search } from '@cio/ui/custom/search';
  import { Chip } from '@cio/ui/custom/chip';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import CheckIcon from '@lucide/svelte/icons/check';
  import CopyIcon from '@lucide/svelte/icons/copy';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import TrashIcon from '@lucide/svelte/icons/trash';
  import UserIcon from '@lucide/svelte/icons/user';
  import { t } from '$lib/utils/functions/translations';
  import { shortenName } from '$lib/utils/functions/string';
  import { ROLE } from '@cio/utils/constants';
  import { ROLE_LABEL } from '$lib/utils/constants/roles';
  import { isOrgAdmin } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import InviteMembersModal from '$features/program/components/invite-members-modal.svelte';
  import { programApi } from '$features/program/api';

  let { data } = $props();

  let memberToDelete = $state<(typeof programApi.members)[number] | null>(null);
  let isDeleteModalOpen = $state(false);
  let filterBy = $state('all');
  let searchValue = $state('');
  let copiedEmail = $state<string | null>(null);

  const members = $derived(sortAndFilterPeople(programApi.members, filterBy));
  const currentUserRole = $derived.by(() => {
    const currentMember = programApi.members.find((member) => member.profileId === $profile.id);
    return currentMember ? Number(currentMember.roleId) : null;
  });
  const canManageMembers = $derived.by(
    () => Boolean($isOrgAdmin) || currentUserRole === ROLE.ADMIN || currentUserRole === ROLE.TUTOR
  );
  const selectOptions = $derived([
    { label: $t('course.navItem.people.roles.filter'), value: 'all' },
    { label: $t(ROLE_LABEL[ROLE.TUTOR]), value: `${ROLE.TUTOR}` },
    { label: $t(ROLE_LABEL[ROLE.STUDENT]), value: `${ROLE.STUDENT}` }
  ]);

  function sortAndFilterPeople(people: typeof programApi.members, activeFilter: string) {
    return [...(people || [])]
      .filter((person) => {
        if (activeFilter === 'all') {
          return true;
        }

        return Number(person.roleId) === Number(activeFilter);
      })
      .sort((a, b) => new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime())
      .sort((a, b) => Number(a.roleId) - Number(b.roleId));
  }

  function filterPeople(query: string, people: typeof programApi.members) {
    const normalizedQuery = query.toLowerCase();

    return people.filter((person) => {
      const fullname = person.profile?.fullname?.toLowerCase() ?? '';
      const email = getEmail(person).toLowerCase();
      return fullname.includes(normalizedQuery) || email.includes(normalizedQuery);
    });
  }

  function getEmail(person: (typeof programApi.members)[number]) {
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

    programApi.success = false;

    await programApi.removeMember(data.programId, memberToDelete.id);
    if (programApi.success) {
      isDeleteModalOpen = false;
      memberToDelete = null;
    }
  }

  function openInviteModal() {
    goto(resolve(`${page.url.pathname}?add=true`, {}));
  }
</script>

<Page.Root class="mx-auto w-[90%] md:max-w-3xl">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('programs.sidebar.people')}</Page.Title>
    </Page.HeaderContent>
    <Page.Action>
      {#if canManageMembers}
        <Button onclick={openInviteModal}>
          <PlusIcon size={16} />
          {$t('programs.people.invite')}
        </Button>
      {/if}
    </Page.Action>
  </Page.Header>

  <Page.Body>
    {#snippet child()}
      <section class="space-y-2">
        <div class="flex flex-col items-center justify-end gap-2 md:flex-row">
          <Search placeholder={$t('course.navItem.people.search')} bind:value={searchValue} />
          <Select.Root type="single" name="roles" bind:value={filterBy}>
            <Select.Trigger class="max-w-[100px]">
              {selectOptions.find((option) => option.value === filterBy)?.label}
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

        <div class="rounded-md border">
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.Head>{$t('course.navItem.people.name')}</Table.Head>
                <Table.Head>{$t('course.navItem.people.role')}</Table.Head>
                <Table.Head>{$t('course.navItem.people.action')}</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {#each filterPeople(searchValue, members) as person}
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
                            <UserIcon class="ui:size-4 ui:text-muted-foreground" />
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

                          <Chip value={$t('course.navItem.people.pending')} className="bg-yellow-200 text-yellow-700" />
                        </div>
                      </div>
                    {/if}
                  </Table.Cell>

                  <Table.Cell class="w-1/4">
                    <p class="w-1/4 text-center text-base font-normal dark:text-white">
                      {getRoleLabel(Number(person.roleId))}
                    </p>
                  </Table.Cell>

                  <Table.Cell class="w-1/4">
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
            </Table.Body>
          </Table.Root>
        </div>
      </section>
    {/snippet}
  </Page.Body>
</Page.Root>

<InviteMembersModal programId={data.programId} />

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
        <Button variant="outline" onclick={deletePerson} loading={programApi.isLoading}>
          {$t('course.navItem.people.delete_confirmation.yes')}
        </Button>
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>
