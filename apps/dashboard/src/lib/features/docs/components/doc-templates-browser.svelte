<script lang="ts">
  import PencilIcon from '@lucide/svelte/icons/pencil';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
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
  import { docsApi } from '../api';
  import { NOTE_BUILTIN_TEMPLATES } from '../utils/doc-builtin-templates';

  interface Props {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** When set, apply template content to this note instead of creating a new one. */
    applyToNoteId?: string | null;
    onApplied?: () => void;
  }

  let { open = $bindable(false), onOpenChange, applyToNoteId = null, onApplied }: Props = $props();
  let isApplying = $state(false);

  function noteHref(docId: string) {
    return resolve(`${$currentOrgPath}/docs/${docId}`, {});
  }

  async function applyBuiltinTemplate(templateId: string) {
    const template = NOTE_BUILTIN_TEMPLATES.find((item) => item.id === templateId);

    if (!template) {
      return;
    }

    isApplying = true;

    if (applyToNoteId) {
      const updated = await docsApi.updateDoc(applyToNoteId, {
        title: t.get(template.titleKey),
        content: template.content
      });
      isApplying = false;

      if (!updated) {
        snackbar.error('docs.templates.create_error');
        return;
      }

      snackbar.success('docs.templates.create_success');
      open = false;
      onOpenChange?.(false);
      onApplied?.();
      return;
    }

    const note = await docsApi.createOrganizationDoc(t.get(template.titleKey));

    if (!note) {
      isApplying = false;
      snackbar.error('docs.templates.create_error');
      return;
    }

    if (template.content) {
      await docsApi.updateDoc(note.id, { content: template.content });
    }

    isApplying = false;
    snackbar.success('docs.templates.create_success');
    open = false;
    onOpenChange?.(false);
    await goto(noteHref(note.id));
  }

  async function removeUserTemplate(templateId: string) {
    const updated = await docsApi.unsetTemplate(templateId);

    if (!updated) {
      snackbar.error('docs.templates.remove_error');
      return;
    }

    snackbar.success('docs.templates.remove_success');
    await docsApi.listTemplates();
    await docsApi.refreshList();
  }

  async function applyUserTemplate(templateId: string) {
    isApplying = true;

    if (applyToNoteId) {
      const source = docsApi.templates.find((item) => item.id === templateId);

      if (!source) {
        isApplying = false;
        snackbar.error('docs.templates.create_error');
        return;
      }

      const updated = await docsApi.updateDoc(applyToNoteId, {
        title: source.title,
        content: source.content
      });
      isApplying = false;

      if (!updated) {
        snackbar.error('docs.templates.create_error');
        return;
      }

      snackbar.success('docs.templates.create_success');
      open = false;
      onOpenChange?.(false);
      onApplied?.();
      return;
    }

    const note = await docsApi.createDocFromTemplate(templateId);
    isApplying = false;

    if (!note) {
      snackbar.error('docs.templates.create_error');
      return;
    }

    snackbar.success('docs.templates.create_success');
    open = false;
    onOpenChange?.(false);
    await goto(noteHref(note.id));
  }

  $effect(() => {
    if (!open) {
      return;
    }

    docsApi.listTemplates();
  });
</script>

<Dialog.Root bind:open {onOpenChange}>
  <Dialog.Content class="flex max-h-[85vh] max-w-5xl flex-col gap-0 overflow-hidden p-0">
    <Dialog.Header class="border-border border-b px-6 py-5">
      <Dialog.Title>{$t('docs.templates.browser_title')}</Dialog.Title>
      <Dialog.Description>{$t('docs.templates.browser_description')}</Dialog.Description>
    </Dialog.Header>

    <div class="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
      <section class="space-y-3">
        <div class="flex items-center gap-2">
          <SparklesIcon size={16} class="ui:text-primary shrink-0" />
          <h3 class="text-sm font-semibold">{$t('docs.templates.builtin_heading')}</h3>
        </div>
        <p class="ui:text-muted-foreground text-sm">{$t('docs.templates.builtin_description')}</p>

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
                      {$t('docs.templates.use_template')}
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
          <h3 class="text-sm font-semibold">{$t('docs.templates.user_heading')}</h3>
        </div>
        <p class="ui:text-muted-foreground text-sm">{$t('docs.templates.user_description')}</p>

        {#if docsApi.templates.length === 0}
          <div
            class="ui:border-border ui:text-muted-foreground flex items-center gap-3 rounded-lg border border-dashed px-4 py-8 text-sm"
          >
            <LayoutTemplateIcon size={18} class="shrink-0" />
            <p>{$t('docs.templates.empty')}</p>
          </div>
        {:else}
          <ul class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {#each docsApi.templates as template (template.id)}
              <li>
                <Card.Root class="ui:hover:border-primary/40 ui:hover:bg-muted/30 h-full transition-colors">
                  <Card.Header class="gap-3">
                    <Card.Title class="line-clamp-2 text-sm leading-snug">{template.title}</Card.Title>
                    <Card.Description class="line-clamp-3 text-xs">
                      {template.plainText || $t('docs.list.no_content')}
                    </Card.Description>
                    <div class="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        class="w-full"
                        loading={isApplying}
                        onclick={() => applyUserTemplate(template.id)}
                      >
                        {$t('docs.templates.use_template')}
                      </Button>
                      <div class="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          class="w-full"
                          onclick={() => {
                            open = false;
                            onOpenChange?.(false);
                            void goto(noteHref(template.id));
                          }}
                        >
                          <PencilIcon size={14} />
                          {$t('docs.templates.edit_template')}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          class="w-full"
                          onclick={() => removeUserTemplate(template.id)}
                        >
                          <Trash2Icon size={14} />
                          {$t('docs.templates.remove_template')}
                        </Button>
                      </div>
                    </div>
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
