<script lang="ts">
  import * as Page from '@cio/ui/base/page';
  import * as Table from '@cio/ui/base/table';
  import { Button } from '@cio/ui/base/button';
  import { Input } from '@cio/ui/base/input';
  import { Progress } from '@cio/ui/base/progress';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import { UserAvatar } from '@cio/ui/custom/user-avatar';
  import TrashIcon from '@lucide/svelte/icons/trash-2';
  import UserPlusIcon from '@lucide/svelte/icons/user-plus';
  import { t } from '$lib/utils/functions/translations';
  import { Empty } from '@cio/ui/custom/empty';
  import UsersIcon from '@lucide/svelte/icons/users';
  import { currentOrg, isOrgAdmin } from '$lib/utils/store/org';
  import { learningPathApi } from '$features/learning-path/api/learning-path.svelte';
  import AddLearningPathMembersModal from '$features/learning-path/components/add-learning-path-members-modal.svelte';
  import LearningPathConfirmDialog from '$features/learning-path/components/learning-path-confirm-dialog.svelte';
  import { formatDate } from '$features/learning-path/utils/learning-path-utils';
  import type { LearningPathMember } from '$features/learning-path/utils/types';

  let { data } = $props();

  let showAddModal = $state(false);
  let searchValue = $state('');
  let memberToRemove = $state<LearningPathMember | null>(null);
  let showRemoveDialog = $state(false);
  let loadedKey = '';

  $effect(() => {
    const organizationId = $currentOrg.id;
    const key = `${organizationId}:${data.pathId}`;
    if (!organizationId || !$isOrgAdmin || key === loadedKey) return;

    loadedKey = key;
    learningPathApi.members = null;
    void learningPathApi.loadMembers(data.pathId);
  });

  const filteredMembers = $derived.by(() => {
    const members = learningPathApi.members;
    if (!members) return null;

    const query = searchValue.trim().toLowerCase();
    if (!query) return members;

    return members.filter((member) =>
      [member.fullname, member.email].some((value) => value?.toLowerCase().includes(query))
    );
  });

  function confirmRemove(member: LearningPathMember) {
    memberToRemove = member;
    showRemoveDialog = true;
  }

  async function removeMember() {
    if (!memberToRemove) return;

    await learningPathApi.removeMember(data.pathId, memberToRemove.id);
    memberToRemove = null;
  }
</script>

<Page.Root class="mx-auto flex w-[90%] px-4 md:max-w-5xl">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('learning_paths.people.heading')}</Page.Title>
      <Page.Subtitle>{$t('learning_paths.people.subtitle')}</Page.Subtitle>
    </Page.HeaderContent>
    {#if $isOrgAdmin}
      <Page.Action>
        <Button onclick={() => (showAddModal = true)} testId="learning-path-add-members">
          <UserPlusIcon size={16} />
          {$t('learning_paths.people.add')}
        </Button>
      </Page.Action>
    {/if}
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      {#if !$isOrgAdmin}
        <Empty
          title={$t('learning_paths.people.admin_only_title')}
          description={$t('learning_paths.admin_only')}
          icon={UsersIcon}
          variant="page"
        />
      {:else}
        <div class="flex flex-col gap-4 pb-8">
          <Input
            class="max-w-xs"
            placeholder={$t('learning_paths.people.search_placeholder')}
            aria-label={$t('learning_paths.people.search_placeholder')}
            bind:value={searchValue}
          />

          {#if filteredMembers && filteredMembers.length === 0}
            <p class="ui:text-muted-foreground text-sm">
              {searchValue.trim() ? $t('learning_paths.people.no_matches') : $t('learning_paths.people.empty')}
            </p>
          {:else}
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.Head>{$t('learning_paths.people.column_learner')}</Table.Head>
                  <Table.Head>{$t('learning_paths.people.column_progress')}</Table.Head>
                  <Table.Head>{$t('learning_paths.people.column_current')}</Table.Head>
                  <Table.Head>{$t('learning_paths.people.column_enrolled')}</Table.Head>
                  <Table.Head class="w-12"><span class="sr-only">{$t('learning_paths.people.remove')}</span></Table.Head
                  >
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {#if !filteredMembers}
                  {#each [0, 1, 2] as index (index)}
                    <Table.Row>
                      <Table.Cell colspan={5}><Skeleton class="h-8 w-full" /></Table.Cell>
                    </Table.Row>
                  {/each}
                {:else}
                  {#each filteredMembers as member (member.id)}
                    <Table.Row>
                      <Table.Cell>
                        <div class="flex items-center gap-3">
                          <UserAvatar src={member.avatarUrl} alt={member.fullname} class="size-8" />
                          <div class="flex min-w-0 flex-col">
                            <span class="truncate text-sm font-medium">{member.fullname}</span>
                            <span class="ui:text-muted-foreground truncate text-xs">{member.email}</span>
                          </div>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <div class="flex min-w-32 flex-col gap-1">
                          <Progress value={member.progressPercent} />
                          <span class="ui:text-muted-foreground text-xs">
                            {$t('learning_paths.people.courses_done', {
                              done: member.completedCourseCount,
                              total: member.courseCount
                            })}
                          </span>
                        </div>
                      </Table.Cell>
                      <Table.Cell class="text-sm">
                        {#if member.completedAt}
                          {$t('learning_paths.people.completed_on', { date: formatDate(member.completedAt) })}
                        {:else}
                          {member.currentCourse?.title ?? '—'}
                        {/if}
                      </Table.Cell>
                      <Table.Cell class="ui:text-muted-foreground text-sm">{formatDate(member.enrolledAt)}</Table.Cell>
                      <Table.Cell>
                        <Button
                          size="icon"
                          variant="secondary"
                          onclick={() => confirmRemove(member)}
                          aria-label={$t('learning_paths.people.remove')}
                        >
                          <TrashIcon size={16} />
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  {/each}
                {/if}
              </Table.Body>
            </Table.Root>
          {/if}
        </div>
      {/if}
    {/snippet}
  </Page.Body>
</Page.Root>

<AddLearningPathMembersModal bind:open={showAddModal} pathId={data.pathId} />

<LearningPathConfirmDialog
  bind:open={showRemoveDialog}
  title={$t('learning_paths.people.remove_title')}
  description={$t('learning_paths.people.remove_description', { name: memberToRemove?.fullname ?? '' })}
  confirmLabel={$t('learning_paths.people.remove')}
  destructive
  onConfirm={removeMember}
/>
