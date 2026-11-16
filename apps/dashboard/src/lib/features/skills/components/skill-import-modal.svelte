<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
  import * as Table from '@cio/ui/base/table';
  import { Button } from '@cio/ui/base/button';
  import { Badge } from '@cio/ui/base/badge';
  import { SKILL_STARTER_SETS } from '@cio/utils/skills';
  import DownloadIcon from '@lucide/svelte/icons/download';

  import { skillsApi } from '$features/skills/api';
  import { downloadTextFile, type ImportSkillsResult } from '$features/skills/utils';
  import { snackbar } from '$features/ui/snackbar/store';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    open?: boolean;
  }

  const PREVIEW_ROWS = 50;
  const STARTER_LABEL_KEYS = {
    'common-core': 'skills.import.starters.common_core',
    'waec-neco': 'skills.import.starters.waec_neco',
    'uk-national-curriculum': 'skills.import.starters.uk'
  } as const;

  let { open = $bindable(false) }: Props = $props();

  let csvText = $state('');
  let fileName = $state('');
  let preview = $state<ImportSkillsResult | null>(null);

  const canImport = $derived(preview !== null && preview.errors.length === 0 && preview.rows.length > 0);

  function reset() {
    csvText = '';
    fileName = '';
    preview = null;
  }

  function handleOpenChange(nextOpen: boolean) {
    open = nextOpen;
    if (!nextOpen) reset();
  }

  async function handleFileChange(event: Event) {
    const file = (event.currentTarget as HTMLInputElement).files?.[0];
    if (!file) return;

    fileName = file.name;
    csvText = await file.text();
    preview = await skillsApi.importCsv(csvText, true);
  }

  async function handleImport() {
    const result = await skillsApi.importCsv(csvText, false);
    if (!result) return;

    snackbar.success(t.get('skills.snackbar.imported', { count: result.rows.length }));
    handleOpenChange(false);
  }
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
  <Dialog.Content class="max-h-[85vh] max-w-3xl overflow-y-auto">
    <Dialog.Header>
      <Dialog.Title>{$t('skills.import.title')}</Dialog.Title>
      <Dialog.Description>{$t('skills.import.description')}</Dialog.Description>
    </Dialog.Header>

    <div class="space-y-4">
      <div class="space-y-2">
        <p class="text-sm font-medium">{$t('skills.import.starters.heading')}</p>
        <div class="flex flex-wrap gap-2">
          {#each SKILL_STARTER_SETS as starter (starter.id)}
            <Button
              variant="outline"
              size="sm"
              onclick={() => downloadTextFile(starter.fileName, starter.csv)}
              testId={`skill-starter-${starter.id}`}
            >
              <DownloadIcon class="size-4" />
              {$t(STARTER_LABEL_KEYS[starter.id])}
            </Button>
          {/each}
        </div>
        <p class="ui:text-muted-foreground text-xs">{$t('skills.import.starters.note')}</p>
      </div>

      <div class="space-y-2">
        <label class="text-sm font-medium" for="skill-import-file">{$t('skills.import.choose_file')}</label>
        <input
          id="skill-import-file"
          type="file"
          accept=".csv,text/csv"
          class="block w-full text-sm"
          data-testid="skill-import-file"
          onchange={handleFileChange}
        />
        {#if fileName}<p class="ui:text-muted-foreground text-xs">{fileName}</p>{/if}
      </div>

      {#if preview}
        <div class="space-y-3" data-testid="skill-import-preview">
          <p class="text-sm font-medium">
            {$t('skills.import.summary', { create: preview.toCreate, update: preview.toUpdate })}
          </p>

          {#if preview.errors.length > 0}
            <div class="rounded-md border border-red-300 p-3 text-sm text-red-700 dark:text-red-300" data-testid="skill-import-errors">
              <p class="font-medium">{$t('skills.import.errors_heading', { count: preview.errors.length })}</p>
              <ul class="mt-1 list-disc pl-5">
                {#each preview.errors.slice(0, PREVIEW_ROWS) as error, index (index)}
                  <li>{$t('skills.import.error_line', { line: error.line, message: error.message })}</li>
                {/each}
              </ul>
            </div>
          {/if}

          {#if preview.rows.length > 0}
            <div class="max-h-64 overflow-auto rounded-md border">
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.Head>{$t('skills.table.code')}</Table.Head>
                    <Table.Head>{$t('skills.table.name')}</Table.Head>
                    <Table.Head>{$t('skills.import.parent')}</Table.Head>
                    <Table.Head>{$t('skills.import.action')}</Table.Head>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {#each preview.rows.slice(0, PREVIEW_ROWS) as row (row.code)}
                    <Table.Row>
                      <Table.Cell class="font-mono text-xs">{row.code}</Table.Cell>
                      <Table.Cell>{row.name}</Table.Cell>
                      <Table.Cell class="font-mono text-xs">{row.parentCode ?? '–'}</Table.Cell>
                      <Table.Cell>
                        <Badge variant={row.action === 'create' ? 'default' : 'secondary'}>
                          {$t(`skills.import.${row.action}`)}
                        </Badge>
                      </Table.Cell>
                    </Table.Row>
                  {/each}
                </Table.Body>
              </Table.Root>
            </div>
            {#if preview.rows.length > PREVIEW_ROWS}
              <p class="ui:text-muted-foreground text-xs">
                {$t('skills.import.more_rows', { count: preview.rows.length - PREVIEW_ROWS })}
              </p>
            {/if}
          {/if}
        </div>
      {/if}
    </div>

    <Dialog.Footer>
      <Button variant="outline" onclick={() => handleOpenChange(false)}>{$t('skills.actions.cancel')}</Button>
      <Button onclick={handleImport} disabled={!canImport} loading={skillsApi.isLoading} testId="skill-import-confirm">
        {$t('skills.import.confirm', { count: preview?.rows.length ?? 0 })}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
