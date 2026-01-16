<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { Button } from '@cio/ui/base/button';
  import * as Table from '@cio/ui/base/table';
  import CopyIcon from '@lucide/svelte/icons/copy';
  import TrashIcon from '@lucide/svelte/icons/trash';
  import CheckIcon from '@lucide/svelte/icons/check';

  import { Chip } from '@cio/ui/custom/chip';
  import * as Avatar from '@cio/ui/base/avatar';
  import { ComingSoon, RoleBasedSecurity } from '$features/ui';
  import InvitationModal from '$lib/features/course/components/people/invitation-modal.svelte';
  import DeleteConfirmation from '$lib/features/course/components/people/delete-confirmation.svelte';

  import { profile } from '$lib/utils/store/user';
  import type { CourseMembers, CourseMember } from '$features/course/utils/types';
  import { courseApi } from '$features/course/api';
  import { t } from '$lib/utils/functions/translations';
  import { shortenName } from '$lib/utils/functions/string';
  import * as Select from '@cio/ui/base/select';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { ROLE_LABEL, ROLES } from '$lib/utils/constants/roles';
  import { peopleApi } from '$features/course/api';
  import { deleteMemberModal } from '$features/course/components/people/store';
  import { Search } from '@cio/ui/custom/search';

  let member: { id?: string; email?: string; profile?: { email: string } } = $state({});
  let filterBy: string = $state(`${ROLES[0].value}`);
  let searchValue = $state('');
  let copiedEmail = $state<string | null>(null);

  const people: CourseMembers = $derived(sortAndFilterPeople(courseApi.group.people, filterBy));

  function filterPeople(_query, people) {
    const query = _query.toLowerCase();
    return people.filter((person) => {
      const { profile, email } = person;
      return profile?.fullname?.toLowerCase()?.includes(query) || email?.includes(query);
    });
  }

  async function deletePerson() {
    if (!member.id || !courseApi.course?.id) return;

    await peopleApi.delete(courseApi.course?.id, member.id);

    if (peopleApi.success) {
      courseApi.group.people = courseApi.group.people.filter((person: { id: string }) => person.id !== member.id);
      courseApi.group.tutors = courseApi.group.tutors.filter((person: CourseMember) => person.id !== member.id);
    }
  }

  function sortAndFilterPeople(_people: CourseMembers, filterBy: string) {
    return (_people || [])
      .filter((person) => {
        if (filterBy === 'all') return true;

        return person.roleId === Number(filterBy);
      })
      .sort(
        (a: CourseMember, b: CourseMember) =>
          new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime()
      )
      .sort((a: CourseMember, b: CourseMember) => Number(a.roleId) - Number(b.roleId));
  }

  function getEmail(person) {
    const { profile, email } = person;

    return profile ? profile.email : email;
  }

  function obscureEmail(email) {
    const [username, domain] = email.split('@');
    const obscuredUsername =
      username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1);

    return `${obscuredUsername}@${domain}`;
  }

  function gotoPerson(person) {
    goto(`${page.url.href}/${person.profileId}`);
  }

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

<InvitationModal />

<DeleteConfirmation email={member.email || (member.profile && member.profile.email)} {deletePerson} />

<section class="space-y-2">
  <div class="flex flex-col items-center justify-end gap-2 md:flex-row">
    <Search placeholder={$t('course.navItem.people.search')} bind:value={searchValue} />
    <Select.Root type="single" name="roles" bind:value={filterBy}>
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
        {#each filterPeople(searchValue, people) as person}
          <Table.Row>
            <!-- first column -->
            <Table.Cell class="w-4/6 md:w-3/6">
              {#if person.profile}
                <div class="flex items-start lg:items-center">
                  <Avatar.Root class="mr-3">
                    <Avatar.Image
                      src={person.profile.avatar_url ? person.profile.avatar_url : '/logo-192.png'}
                      alt={person.profile.fullname ? person.profile.fullname : 'User'}
                    />
                    <Avatar.Fallback>{shortenName(person.profile.fullname) || 'U'}</Avatar.Fallback>
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
                      <RoleBasedSecurity allowedRoles={[1, 2]}>
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
                    </RoleBasedSecurity>

                    <Chip value={$t('course.navItem.people.pending')} className="bg-yellow-200 text-yellow-700" />
                  </div>
                </div>
              {/if}
            </Table.Cell>

            <!-- second column -->
            <Table.Cell class="w-1/4">
              <p class=" w-1/4 text-center text-base font-normal dark:text-white">
                {$t(ROLE_LABEL[Number(person.roleId)])}
              </p>
            </Table.Cell>

            <!-- third column -->
            <Table.Cell class="w-1/4">
              <RoleBasedSecurity allowedRoles={[1, 2]}>
                <div class="hidden space-x-2 sm:flex sm:items-center">
                  {#if person.profileId !== $profile.id}
                    <IconButton
                      onclick={() => {
                        member = person;
                        $deleteMemberModal.open = true;
                      }}
                    >
                      <TrashIcon size={16} />
                    </IconButton>

                    <Button variant="outline" onclick={() => gotoPerson(person)}>
                      {$t('course.navItem.people.view')}
                    </Button>
                  {/if}
                </div>
              </RoleBasedSecurity>
            </Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </div>
</section>
