<script lang="ts">
  import { goto } from '$app/navigation';
  import { NOTE_COURSE_TEMPLATES } from '@cio/utils/constants/note-course-templates';
  import { Spinner } from '@cio/ui/base/spinner';
  import { currentOrg, currentOrgPath } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import { notesApi } from '../api';
  import NoteTemplateCard from '../components/note-template-card.svelte';
  import { displayNoteTitle, notePreviewText } from '../utils/note-list-utils';
  import { resolve } from '$app/paths';
  import { Button } from '@cio/ui/base/button';

  let applyingTemplateId = $state<string | null>(null);

  function noteHref(noteId: string) {
    return resolve(`${$currentOrgPath}/notes/${noteId}`, {});
  }

  async function handleUseBuiltIn(templateId: string) {
    if (!$currentOrg.id) {
      return;
    }

    applyingTemplateId = templateId;
    const result = await notesApi.createFromCourseTemplate(templateId);
    applyingTemplateId = null;

    if (!result?.rootNote) {
      snackbar.error('notes.templates.create_error');
      return;
    }

    snackbar.success('notes.templates.create_success');
    await notesApi.listSidebar();
    await goto(noteHref(result.rootNote.id));
  }

  async function handleUseOrgTemplate(templateNoteId: string) {
    applyingTemplateId = templateNoteId;
    const created = await notesApi.createNoteFromTemplate(templateNoteId);
    applyingTemplateId = null;

    if (!created) {
      snackbar.error('notes.templates.create_error');
      return;
    }

    snackbar.success('notes.templates.create_success');
    await notesApi.listSidebar();
    await goto(noteHref(created.id));
  }

  $effect(() => {
    if ($currentOrg.id) {
      void notesApi.listTemplates();
    }
  });
</script>

<div class="flex min-h-0 flex-1 flex-col overflow-hidden">
  <div class="border-border border-b px-6 py-6">
    <h1 class="text-2xl font-semibold">{$t('notes.templates.page_title')}</h1>
    <p class="ui:text-muted-foreground mt-2 max-w-3xl text-sm leading-relaxed">
      {$t('notes.templates.page_subtitle')}
    </p>
  </div>

  <div class="min-h-0 flex-1 overflow-y-auto p-6">
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {#each NOTE_COURSE_TEMPLATES as template (template.id)}
        <NoteTemplateCard
          {template}
          loading={applyingTemplateId === template.id}
          onUse={() => handleUseBuiltIn(template.id)}
        />
      {/each}
    </div>

    <section class="mt-10 space-y-4">
      <div>
        <h2 class="text-lg font-semibold">{$t('notes.templates.your_templates_heading')}</h2>
        <p class="ui:text-muted-foreground mt-1 text-sm">{$t('notes.templates.your_templates_description')}</p>
      </div>

      {#if notesApi.isLoading && notesApi.templates.length === 0}
        <div class="flex justify-center py-8">
          <Spinner />
        </div>
      {:else if notesApi.templates.length === 0}
        <p class="ui:text-muted-foreground text-sm">{$t('notes.templates.your_templates_empty')}</p>
      {:else}
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {#each notesApi.templates as template (template.id)}
            <article class="border-border flex flex-col gap-3 rounded-xl border p-4">
              <div class="space-y-1">
                <h3 class="font-semibold">{displayNoteTitle(template.title)}</h3>
                <p class="ui:text-muted-foreground line-clamp-3 text-sm">{notePreviewText(template)}</p>
              </div>
              <Button
                class="mt-auto w-full"
                variant="secondary"
                loading={applyingTemplateId === template.id}
                onclick={() => handleUseOrgTemplate(template.id)}
              >
                {$t('notes.templates.use_template')}
              </Button>
            </article>
          {/each}
        </div>
      {/if}
    </section>
  </div>
</div>
