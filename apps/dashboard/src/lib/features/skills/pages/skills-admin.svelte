<script lang="ts">
  import * as ButtonGroup from '@cio/ui/base/button-group';
  import { Button } from '@cio/ui/base/button';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import * as Page from '@cio/ui/base/page';
  import * as Table from '@cio/ui/base/table';
  import { Empty } from '@cio/ui/custom/empty';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { InputField } from '@cio/ui/custom/input-field';

  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import TargetIcon from '@lucide/svelte/icons/target';

  import { skillsApi } from '$features/skills/api';
  import { SkillFormModal, SkillImportModal } from '$features/skills/components';
  import { buildSkillRows, type Skill } from '$features/skills/utils';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    initialSkills: Skill[];
  }

  let { initialSkills }: Props = $props();

  let isFormOpen = $state(false);
  let isImportOpen = $state(false);
  let editingSkill = $state<Skill | null>(null);
  let search = $state('');

  const rows = $derived(buildSkillRows(skillsApi.skills, search));

  $effect(() => {
    skillsApi.skills = initialSkills;
  });

  function openForm(skill: Skill | null) {
    skillsApi.reset();
    editingSkill = skill;
    isFormOpen = true;
  }

  async function handleDelete(skill: Skill) {
    if (!confirm(t.get('skills.actions.confirm_delete', { name: skill.name }))) return;

    await skillsApi.remove(skill.id);
  }
</script>

<svelte:head>
  <title>{$t('skills.page_title')}</title>
</svelte:head>

<Page.Root class="w-full">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('skills.heading')}</Page.Title>
      <Page.Subtitle>{$t('skills.page_subtitle')}</Page.Subtitle>
    </Page.HeaderContent>
    <Page.Action>
      <ButtonGroup.Root>
        <Button onclick={() => openForm(null)} testId="skill-create">{$t('skills.actions.create')}</Button>
        <ButtonGroup.Separator />
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            {#snippet child({ props })}
              <Button {...props} size="icon" aria-label={$t('skills.actions.more')}>
                <ChevronDownIcon size={16} />
              </Button>
            {/snippet}
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end" class="w-56">
            <DropdownMenu.Item onclick={() => openForm(null)}>{$t('skills.actions.create')}</DropdownMenu.Item>
            <DropdownMenu.Item onclick={() => (isImportOpen = true)} data-testid="skill-import-open">
              {$t('skills.actions.import')}
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </ButtonGroup.Root>
    </Page.Action>
  </Page.Header>

  <Page.Body>
    {#snippet child()}
      {#if !skillsApi.skills.length}
        <Empty title={$t('skills.empty.title')} description={$t('skills.empty.description')} icon={TargetIcon} variant="page">
          <div class="flex gap-2">
            <Button onclick={() => openForm(null)}>{$t('skills.actions.create')}</Button>
            <Button variant="outline" onclick={() => (isImportOpen = true)}>{$t('skills.actions.import')}</Button>
          </div>
        </Empty>
      {:else}
        <div class="mb-4 max-w-sm">
          <InputField
            placeholder={$t('skills.search_placeholder')}
            bind:value={search}
            testId="skill-search"
          />
        </div>

        <div class="rounded-md border">
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.Head>{$t('skills.table.code')}</Table.Head>
                <Table.Head>{$t('skills.table.name')}</Table.Head>
                <Table.Head>{$t('skills.table.framework')}</Table.Head>
                <Table.Head>{$t('skills.table.questions')}</Table.Head>
                <Table.Head class="text-right">{$t('skills.table.action')}</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {#each rows as row (row.id)}
                <Table.Row data-testid="skill-row">
                  <Table.Cell class="font-mono text-xs">
                    <span style={`padding-left: ${row.depth * 16}px`}>{row.code}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <p class="text-sm">{row.name}</p>
                    {#if row.description}
                      <p class="ui:text-muted-foreground max-w-[420px] truncate text-xs">{row.description}</p>
                    {/if}
                  </Table.Cell>
                  <Table.Cell class="text-sm">{row.framework ?? '–'}</Table.Cell>
                  <Table.Cell class="text-sm">{row.questionCount}</Table.Cell>
                  <Table.Cell class="text-right">
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger class="inline-flex items-center justify-center">
                        <IconButton variant="outline" size="icon-sm" aria-label={$t('skills.actions.more')}>
                          <EllipsisVerticalIcon size={16} />
                        </IconButton>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Content align="end">
                        <DropdownMenu.Item onclick={() => openForm(row)}>{$t('skills.actions.edit')}</DropdownMenu.Item>
                        <DropdownMenu.Item onclick={() => handleDelete(row)}>{$t('skills.actions.delete')}</DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Root>
                  </Table.Cell>
                </Table.Row>
              {:else}
                <Table.Row>
                  <Table.Cell colspan={5} class="ui:text-muted-foreground text-sm">{$t('skills.table.no_matches')}</Table.Cell>
                </Table.Row>
              {/each}
            </Table.Body>
          </Table.Root>
        </div>
      {/if}
    {/snippet}
  </Page.Body>
</Page.Root>

<SkillFormModal bind:open={isFormOpen} skill={editingSkill} />
<SkillImportModal bind:open={isImportOpen} />
