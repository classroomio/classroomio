<script lang="ts">
  import * as Page from '@cio/ui/base/page';
  import { Button } from '@cio/ui/base/button';
  import { Input } from '@cio/ui/base/input';
  import { Textarea } from '@cio/ui/base/textarea';
  import { Label } from '@cio/ui/base/label';
  import * as Select from '@cio/ui/base/select';
  import { Separator } from '@cio/ui/base/separator';
  import { t } from '$lib/utils/functions/translations';
  import { programApi } from '$features/program/api';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { currentOrgPath, isOrgAdmin } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { ROLE } from '@cio/utils/constants';
  import GoalsSection from '$features/program/components/goals/goals-section.svelte';

  let { data } = $props();
  const programId = data.programId as string;

  let name = $state('');
  let description = $state('');
  let status = $state<'ACTIVE' | 'INACTIVE' | 'ARCHIVED'>('ACTIVE');
  let isSaving = $state(false);

  $effect(() => {
    const p = programApi.program;
    if (p) {
      name = p.name;
      description = p.description ?? '';
      status = (p.status as 'ACTIVE' | 'INACTIVE' | 'ARCHIVED') ?? 'ACTIVE';
    }
  });

  const currentMemberRole = $derived(programApi.members.find((m) => m.profileId === $profile.id)?.roleId ?? null);
  const canManageGoals = $derived(
    Boolean($isOrgAdmin) || currentMemberRole === ROLE.ADMIN || currentMemberRole === ROLE.TUTOR
  );

  const statusOptions = [
    { value: 'ACTIVE', label: $t('programs.status.active') || 'Active' },
    { value: 'INACTIVE', label: $t('programs.status.inactive') || 'Inactive' },
    { value: 'ARCHIVED', label: $t('programs.status.archived') || 'Archived' }
  ];

  const hasUnsavedChanges = $derived.by(() => {
    const currentProgram = programApi.program;
    if (!currentProgram) {
      return false;
    }

    return (
      name.trim() !== currentProgram.name ||
      description.trim() !== (currentProgram.description ?? '') ||
      status !== ((currentProgram.status as 'ACTIVE' | 'INACTIVE' | 'ARCHIVED') ?? 'ACTIVE')
    );
  });

  async function handleSave() {
    isSaving = true;

    try {
      await programApi.updateProgram(programId, {
        name: name.trim() || undefined,
        description: description.trim() || null,
        status
      });
    } finally {
      isSaving = false;
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        $t('programs.settings.confirm_delete') || 'Are you sure you want to delete this program? This cannot be undone.'
      )
    ) {
      return;
    }
    await programApi.deleteProgram(programId);
    goto(resolve(`${$currentOrgPath}/programs`, {}));
  }
</script>

<Page.Root class="mx-auto flex w-[90%] px-4 md:max-w-2xl lg:max-w-3xl">
  <Page.Header class="sticky top-13 z-10 bg-white">
    <Page.HeaderContent>
      <Page.Title>{$t('programs.sidebar.settings') || 'Settings'}</Page.Title>
    </Page.HeaderContent>
    <Page.Action>
      <Button variant="secondary" loading={isSaving} disabled={isSaving || !hasUnsavedChanges} onclick={handleSave}>
        {$t('programs.settings.save') || 'Save Changes'}
      </Button>
    </Page.Action>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <div class="w-full px-4 py-6">
        <div class="flex flex-col gap-6">
          <section>
            <h2 class="mb-4 text-sm font-semibold">{$t('programs.settings.general') || 'General'}</h2>
            <div class="flex flex-col gap-4">
              <div class="flex flex-col gap-1.5">
                <Label for="prog-name">{$t('programs.settings.name_label') || 'Name'} *</Label>
                <Input id="prog-name" bind:value={name} maxlength={255} />
              </div>

              <div class="flex flex-col gap-1.5">
                <Label for="prog-desc">{$t('programs.settings.description_label') || 'Description'}</Label>
                <Textarea id="prog-desc" bind:value={description} rows={4} maxlength={2000} />
              </div>

              <div class="flex flex-col gap-1.5">
                <Label>{$t('programs.settings.status_label') || 'Status'}</Label>
                <Select.Root type="single" bind:value={status}>
                  <Select.Trigger class="w-48">
                    {statusOptions.find((o) => o.value === status)?.label}
                  </Select.Trigger>
                  <Select.Content style="z-index: 500 !important">
                    {#each statusOptions as option (option.value)}
                      <Select.Item value={option.value}>{option.label}</Select.Item>
                    {/each}
                  </Select.Content>
                </Select.Root>
              </div>
            </div>
          </section>

          <Separator />

          <GoalsSection {programId} canManage={canManageGoals} />

          <Separator />

          <section>
            <h2 class="mb-1 text-sm font-semibold text-red-600">
              {$t('programs.settings.danger_zone') || 'Danger Zone'}
            </h2>
            <p class="text-muted-foreground mb-4 text-sm">
              {$t('programs.settings.delete_description') ||
                'Once deleted, this program and all its data cannot be recovered.'}
            </p>
            <Button variant="destructive" onclick={handleDelete} disabled={programApi.isLoading}>
              {$t('programs.settings.delete') || 'Delete Program'}
            </Button>
          </section>
        </div>
      </div>
    {/snippet}
  </Page.Body>
</Page.Root>
