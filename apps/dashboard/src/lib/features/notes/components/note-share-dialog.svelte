<script lang="ts">
  import CopyIcon from '@lucide/svelte/icons/copy';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import * as Dialog from '@cio/ui/base/dialog';
  import * as RadioGroup from '@cio/ui/base/radio-group';
  import * as Select from '@cio/ui/base/select';
  import { Label } from '@cio/ui/base/label';
  import { Button } from '@cio/ui/base/button';
  import { Input } from '@cio/ui/base/input';
  import { currentOrg } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import { slugifyTitle } from '@cio/utils/validation/shared/slug';
  import { orgApi } from '$features/org/api/org.svelte';
  import { notesApi } from '../api';
  import { buildPublicNoteUrl } from '../utils/note-public-url';
  import type { NoteShareVisibility } from '../utils/types';

  type ShareGrant = {
    profileId: string;
    permission: 'read' | 'write';
    profileFullname?: string | null;
    profileEmail?: string | null;
  };

  interface Props {
    noteId: string;
    noteTitle?: string;
    ownerId?: string;
    visibility?: NoteShareVisibility;
    noteSlug?: string | null;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onVisibilityChange?: (visibility: NoteShareVisibility, slug?: string | null) => void;
  }

  let {
    noteId,
    noteTitle = '',
    ownerId = '',
    visibility = 'private',
    noteSlug = null,
    open = $bindable(false),
    onOpenChange,
    onVisibilityChange
  }: Props = $props();

  let selectedVisibility = $state<NoteShareVisibility>('private');
  let slugValue = $state('');
  let savedSlug = $state<string | null>(null);
  let isSaving = $state(false);
  let grants = $state<ShareGrant[]>([]);
  let selectedMemberId = $state<string>('');
  let selectedPermission = $state<'read' | 'write'>('read');

  const visibilityOptions = $derived([
    {
      value: 'private' as const,
      label: t.get('notes.share.private_label'),
      description: t.get('notes.share.private_description')
    },
    {
      value: 'team' as const,
      label: t.get('notes.share.team_label'),
      description: t.get('notes.share.team_description', { orgName: $currentOrg.name })
    },
    {
      value: 'public' as const,
      label: t.get('notes.share.public_label'),
      description: t.get('notes.share.public_description')
    }
  ]);

  const availableMembers = $derived(
    orgApi.teamMembers.filter(
      (member) =>
        member.profileId &&
        member.profileId !== ownerId &&
        member.profileId !== $profile.id &&
        !grants.some((grant) => grant.profileId === member.profileId)
    )
  );

  const publicUrl = $derived(savedSlug ? buildPublicNoteUrl($currentOrg, savedSlug) : '');

  async function loadShares() {
    const rows = await notesApi.getNoteShares(noteId);
    grants = rows.map((row) => ({
      profileId: row.profileId,
      permission: row.permission,
      profileFullname: row.profileFullname,
      profileEmail: row.profileEmail
    }));
  }

  function addGrant() {
    if (!selectedMemberId) {
      return;
    }

    const member = orgApi.teamMembers.find((item) => item.profileId === selectedMemberId);

    grants = [
      ...grants,
      {
        profileId: selectedMemberId,
        permission: selectedPermission,
        profileFullname: member?.fullname,
        profileEmail: member?.email
      }
    ];
    selectedMemberId = '';
    selectedPermission = 'read';
  }

  function removeGrant(profileId: string) {
    grants = grants.filter((grant) => grant.profileId !== profileId);
  }

  async function handleSave() {
    isSaving = true;
    const slug = selectedVisibility === 'public' ? slugValue.trim() || slugifyTitle(noteTitle) : undefined;
    const updated = await notesApi.updateNoteVisibility(noteId, selectedVisibility, slug);

    if (!updated) {
      isSaving = false;
      snackbar.error('notes.share.save_error');
      return;
    }

    if (selectedVisibility === 'private') {
      const savedShares = await notesApi.replaceNoteShares(
        noteId,
        grants.map((grant) => ({
          profileId: grant.profileId,
          permission: grant.permission
        }))
      );

      if (!savedShares) {
        isSaving = false;
        snackbar.error('notes.share.save_error');
        return;
      }
    }

    isSaving = false;
    savedSlug = updated.slug ?? null;
    snackbar.success('notes.share.save_success');
    onVisibilityChange?.(selectedVisibility, savedSlug);
    open = false;
  }

  async function handleCopyLink() {
    if (!publicUrl) {
      return;
    }

    await navigator.clipboard.writeText(publicUrl);
    snackbar.success('notes.share.copy_success');
  }

  $effect(() => {
    if (!open) {
      return;
    }

    selectedVisibility = visibility;
    savedSlug = noteSlug;
    slugValue = noteSlug ?? slugifyTitle(noteTitle);
    void orgApi.getOrgTeam();
    void loadShares();
  });
</script>

<Dialog.Root bind:open {onOpenChange}>
  <Dialog.Content class="max-w-lg">
    <Dialog.Header>
      <Dialog.Title>{$t('notes.share.title')}</Dialog.Title>
      <Dialog.Description>{$t('notes.share.description')}</Dialog.Description>
    </Dialog.Header>

    <RadioGroup.Root bind:value={selectedVisibility} class="gap-4 py-2">
      {#each visibilityOptions as option (option.value)}
        <div class="flex items-start gap-3 rounded-lg border p-3">
          <RadioGroup.Item value={option.value} id={`note-share-${option.value}`} class="mt-1" />
          <div class="space-y-1">
            <Label for={`note-share-${option.value}`} class="font-medium">{option.label}</Label>
            <p class="ui:text-muted-foreground text-sm">{option.description}</p>
          </div>
        </div>
      {/each}
    </RadioGroup.Root>

    {#if selectedVisibility === 'private'}
      <div class="space-y-3 border-t pt-4">
        <div>
          <h3 class="text-sm font-semibold">{$t('notes.share.people_heading')}</h3>
        </div>

        {#if grants.length > 0}
          <ul class="space-y-2">
            {#each grants as grant (grant.profileId)}
              <li class="flex items-center gap-2 rounded-lg border px-3 py-2">
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium">{grant.profileFullname || grant.profileEmail}</p>
                </div>
                <Select.Root
                  type="single"
                  value={grant.permission}
                  onValueChange={(value) => {
                    if (!value) return;
                    grants = grants.map((item) =>
                      item.profileId === grant.profileId
                        ? { ...item, permission: value as 'read' | 'write' }
                        : item
                    );
                  }}
                >
                  <Select.Trigger class="h-8 w-28">
                    {grant.permission === 'write'
                      ? $t('notes.share.permission_write')
                      : $t('notes.share.permission_read')}
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="read">{$t('notes.share.permission_read')}</Select.Item>
                    <Select.Item value="write">{$t('notes.share.permission_write')}</Select.Item>
                  </Select.Content>
                </Select.Root>
                <Button variant="ghost" size="icon-sm" onclick={() => removeGrant(grant.profileId)}>
                  <Trash2Icon size={14} />
                </Button>
              </li>
            {/each}
          </ul>
        {/if}

        <div class="flex flex-wrap items-end gap-2">
          <div class="min-w-[180px] flex-1 space-y-1">
            <Label>{$t('notes.share.people_heading')}</Label>
            <Select.Root type="single" bind:value={selectedMemberId}>
              <Select.Trigger class="h-9 w-full">
                {availableMembers.find((member) => member.profileId === selectedMemberId)?.fullname ??
                  $t('notes.comments.mention_team_member')}
              </Select.Trigger>
              <Select.Content>
                {#each availableMembers as member (member.profileId)}
                  {#if member.profileId}
                    <Select.Item value={member.profileId}>{member.fullname || member.email}</Select.Item>
                  {/if}
                {/each}
              </Select.Content>
            </Select.Root>
          </div>

          <Select.Root type="single" bind:value={selectedPermission}>
            <Select.Trigger class="h-9 w-28">
              {selectedPermission === 'write'
                ? $t('notes.share.permission_write')
                : $t('notes.share.permission_read')}
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="read">{$t('notes.share.permission_read')}</Select.Item>
              <Select.Item value="write">{$t('notes.share.permission_write')}</Select.Item>
            </Select.Content>
          </Select.Root>

          <Button variant="secondary" onclick={addGrant}>
            <PlusIcon size={14} />
          </Button>
        </div>
      </div>
    {/if}

    {#if selectedVisibility === 'public'}
      <div class="space-y-2 pb-2">
        <Label for="note-public-slug">{$t('notes.share.public_slug_label')}</Label>
        <Input id="note-public-slug" bind:value={slugValue} placeholder={slugifyTitle(noteTitle)} />
        <p class="ui:text-muted-foreground text-xs">{$t('notes.share.public_slug_hint')}</p>
      </div>
    {/if}

    {#if publicUrl}
      <div class="ui:bg-muted/30 flex items-center gap-2 rounded-lg border px-3 py-2">
        <p class="min-w-0 flex-1 truncate text-xs">{publicUrl}</p>
        <Button size="icon-sm" variant="secondary" onclick={handleCopyLink}>
          <CopyIcon size={14} />
        </Button>
      </div>
    {/if}

    <Dialog.Footer>
      <Button variant="secondary" onclick={() => (open = false)}>{$t('notes.share.cancel')}</Button>
      <Button loading={isSaving} onclick={handleSave}>{$t('notes.share.save')}</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
