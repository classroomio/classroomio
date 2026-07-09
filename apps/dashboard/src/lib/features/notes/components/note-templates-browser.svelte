<script lang="ts">
  import LayoutTemplateIcon from '@lucide/svelte/icons/layout-template';
  import SparklesIcon from '@lucide/svelte/icons/sparkles';
  import * as Card from '@cio/ui/base/card';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { Separator } from '@cio/ui/base/separator';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { currentOrgPath } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import { notesApi } from '../api';
  import { NOTE_BUILTIN_TEMPLATES } from '../utils/note-builtin-templates';

  interface Props {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** When set, apply template content to this note instead of creating a new one. */
    applyToNoteId?: string | null;
    onApplied?: () => void;
  }

  let { open = $bindable(false), onOpenChange, applyToNoteId = null, onApplied }: Props = $props();
  let isApplying = $state(false);

  function noteHref(noteId: string) {
    return resolve(`${$currentOrgPath}/notes/${noteId}`, {});
  }

  async function applyBuiltinTemplate(templateId: string) {
    const template = NOTE_BUILTIN_TEMPLATES.find((item) => item.id === templateId);

    if (!template) {
      return;
    }

    isApplying = true;

    if (applyToNoteId) {
      const updated = await notesApi.updateNote(applyToNoteId, {
        title: t.get(template.titleKey),
        content: template.content
      });
      isApplying = false;

      if (!updated) {
        snackbar.error('notes.templates.create_error');
        return;
      }

      snackbar.success('notes.templates.create_success');
      open = false;
      onOpenChange?.(false);
      onApplied?.();
      return;
    }

    const note = await notesApi.createWorkspaceNote(t.get(template.titleKey));

    if (!note) {
      isApplying = false;
      snackbar.error('notes.templates.create_error');
      return;
    }

    if (template.content) {
      await notesApi.updateNote(note.id, { content: template.content });
    }

    isApplying = false;
    snackbar.success('notes.templates.create_success');
    open = false;
    onOpenChange?.(false);
    await goto(noteHref(note.id));
  }

  async function applyUserTemplate(templateId: string) {
    isApplying = true;

    if (applyToNoteId) {
      const source = notesApi.templates.find((item) => item.id === templateId);

      if (!source) {
        isApplying = false;
        snackbar.error('notes.templates.create_error');
        return;
      }

      const updated = await notesApi.updateNote(applyToNoteId, {
        title: source.title,
        content: source.content
      });
      isApplying = false;

      if (!updated) {
        snackbar.error('notes.templates.create_error');
        return;
      }

      snackbar.success('notes.templates.create_success');
      open = false;
      onOpenChange?.(false);
      onApplied?.();
      return;
    }

    const note = await notesApi.createNoteFromTemplate(templateId);
    isApplying = false;

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
  <Dialog.Content class="flex max-h-[85vh] max-w-5xl flex-col gap-0 overflow-hidden p-0">
    <Dialog.Header class="border-border border-b px-6 py-5">
      <Dialog.Title>{$t('notes.templates.browser_title')}</Dialog.Title>
      <Dialog.Description>{$t('notes.templates.browser_description')}</Dialog.Description>
    </Dialog.Header>

    <div class="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
      <section class="space-y-3">
        <div class="flex items-center gap-2">
          <SparklesIcon size={16} class="ui:text-primary shrink-0" />
          <h3 class="text-sm font-semibold">{$t('notes.templates.builtin_heading')}</h3>
        </div>
        <p class="ui:text-muted-foreground text-sm">{$t('notes.templates.builtin_description')}</p>

        <div class="-mx-1 overflow-x-auto px-1 pb-1">
          <ul class="flex min-w-min gap-3">
            {#each NOTE_BUILTIN_TEMPLATES as template (template.id)}
              <li class="w-56 shrink-0">
                <Card.Root class="ui:hover:border-primary/40 ui:hover:bg-muted/30 h-full transition-colors">
                  <Card.Header class="gap-3">
                    <Card.Title class="line-clamp-2 text-sm leading-snug">{$t(template.titleKey)}</Card.Title>
                    <Card.Description class="line-clamp-3 text-xs">{$t(template.descriptionKey)}</Card.Description>
                    <Button
                      size="sm"
                      variant="secondary"
                      class="w-full"
                      loading={isApplying}
                      onclick={() => applyBuiltinTemplate(template.id)}
                    >
                      {$t('notes.templates.use_template')}
                    </Button>
                  </Card.Header>
                </Card.Root>
              </li>
            {/each}
          </ul>
        </div>
      </section>

      <Separator />

      <section class="space-y-3">
        <div class="flex items-center gap-2">
          <LayoutTemplateIcon size={16} class="ui:text-muted-foreground shrink-0" />
          <h3 class="text-sm font-semibold">{$t('notes.templates.user_heading')}</h3>
        </div>
        <p class="ui:text-muted-foreground text-sm">{$t('notes.templates.user_description')}</p>

        {#if notesApi.templates.length === 0}
          <div
            class="ui:border-border ui:text-muted-foreground flex items-center gap-3 rounded-lg border border-dashed px-4 py-8 text-sm"
          >
            <LayoutTemplateIcon size={18} class="shrink-0" />
            <p>{$t('notes.templates.empty')}</p>
          </div>
        {:else}
          <ul class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {#each notesApi.templates as template (template.id)}
              <li>
                <Card.Root class="ui:hover:border-primary/40 ui:hover:bg-muted/30 h-full transition-colors">
                  <Card.Header class="gap-3">
                    <Card.Title class="line-clamp-2 text-sm leading-snug">{template.title}</Card.Title>
                    <Card.Description class="line-clamp-3 text-xs">
                      {template.plainText || $t('notes.list.no_content')}
                    </Card.Description>
                    <Button
                      size="sm"
                      variant="secondary"
                      class="w-full"
                      loading={isApplying}
                      onclick={() => applyUserTemplate(template.id)}
                    >
                      {$t('notes.templates.use_template')}
                    </Button>
                  </Card.Header>
                </Card.Root>
              </li>
            {/each}
          </ul>
        {/if}
      </section>
    </div>
  </Dialog.Content>
</Dialog.Root>
