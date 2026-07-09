<script lang="ts">
  import LayoutTemplateIcon from '@lucide/svelte/icons/layout-template';
  import * as Card from '@cio/ui/base/card';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { cn } from '@cio/ui/tools';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { currentOrgPath } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import { notesApi } from '../api';

  interface Props {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }

  let { open = $bindable(false), onOpenChange }: Props = $props();
  let creatingTemplateId = $state<string | null>(null);

  function noteHref(noteId: string) {
    return resolve(`${$currentOrgPath}/notes/${noteId}`, {});
  }

  async function handleUseTemplate(templateId: string) {
    creatingTemplateId = templateId;
    const note = await notesApi.createNoteFromTemplate(templateId);
    creatingTemplateId = null;

    if (!note) {
      snackbar.error('notes.templates.create_error');
      return;
    }

    snackbar.success('notes.templates.create_success');
    open = false;
    onOpenChange?.(false);
    await goto(noteHref(note.id));
  }

  $effect(() => {
    if (!open) {
      return;
    }

    notesApi.listTemplates();
  });
</script>

<Dialog.Root bind:open {onOpenChange}>
  <Dialog.Content class="max-h-[80vh] max-w-lg overflow-y-auto">
    <Dialog.Header>
      <Dialog.Title>{$t('notes.templates.heading')}</Dialog.Title>
      <Dialog.Description>{$t('notes.templates.empty')}</Dialog.Description>
    </Dialog.Header>

    {#if notesApi.templates.length === 0}
      <div
        class="ui:border-border ui:text-muted-foreground flex items-center gap-3 rounded-lg border border-dashed px-4 py-5 text-sm"
      >
        <LayoutTemplateIcon size={18} class="shrink-0" />
        <p>{$t('notes.templates.empty')}</p>
      </div>
    {:else}
      <ul class="grid gap-3 py-2">
        {#each notesApi.templates as template (template.id)}
          <li>
            <Card.Root class="ui:hover:bg-muted/40 transition-colors">
              <Card.Header class="gap-3">
                <Card.Title class="line-clamp-2 text-sm leading-snug">{template.title}</Card.Title>
                <Button
                  size="sm"
                  variant="secondary"
                  loading={creatingTemplateId === template.id}
                  onclick={() => handleUseTemplate(template.id)}
                >
                  {$t('notes.templates.use_template')}
                </Button>
              </Card.Header>
            </Card.Root>
          </li>
        {/each}
      </ul>
    {/if}
  </Dialog.Content>
</Dialog.Root>
