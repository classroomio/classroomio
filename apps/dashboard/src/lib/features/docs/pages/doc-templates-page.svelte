<script lang="ts">
  import { goto } from '$app/navigation';
  import { DOC_COURSE_TEMPLATES } from '@cio/utils/constants/note-course-templates';
  import * as Card from '@cio/ui/base/card';
  import { Spinner } from '@cio/ui/base/spinner';
  import { Button } from '@cio/ui/base/button';
  import { currentOrg, currentOrgPath } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import { docsApi } from '../api';
  import NoteTemplateCard from '../components/doc-template-card.svelte';
  import { displayNoteTitle, notePreviewText } from '../utils/doc-list-utils';
  import { resolve } from '$app/paths';

  let applyingTemplateId = $state<string | null>(null);

  function noteHref(docId: string) {
    return resolve(`${$currentOrgPath}/docs/${docId}`, {});
  }

  async function handleUseBuiltIn(templateId: string) {
    if (!$currentOrg.id) {
      return;
    }

    applyingTemplateId = templateId;
    const result = await docsApi.createFromCourseTemplate(templateId);
    applyingTemplateId = null;

    if (!result?.rootNote) {
      snackbar.error('docs.templates.create_error');
      return;
    }

    snackbar.success('docs.templates.create_success');
    await docsApi.listSidebar();
    await goto(noteHref(result.rootNote.id));
  }

  async function handleUseOrgTemplate(templateNoteId: string) {
    applyingTemplateId = templateNoteId;
    const created = await docsApi.createDocFromTemplate(templateNoteId);
    applyingTemplateId = null;

    if (!created) {
      snackbar.error('docs.templates.create_error');
      return;
    }

    snackbar.success('docs.templates.create_success');
    await docsApi.listSidebar();
    await goto(noteHref(created.id));
  }

  $effect(() => {
    if ($currentOrg.id) {
      void docsApi.listTemplates();
    }
  });
</script>

<div class="flex min-h-0 flex-1 flex-col overflow-hidden">
  <div class="border-border border-b px-6 py-6">
    <div class="mx-auto w-full max-w-4xl">
      <h1 class="text-2xl font-semibold">{$t('docs.templates.page_title')}</h1>
      <p class="ui:text-muted-foreground mt-2 text-sm leading-relaxed">
        {$t('docs.templates.page_subtitle')}
      </p>
    </div>
  </div>

  <div class="min-h-0 flex-1 overflow-y-auto px-6 py-6">
    <div class="mx-auto w-full max-w-4xl space-y-10">
      <ul class="grid gap-3 sm:grid-cols-2">
        {#each DOC_COURSE_TEMPLATES as template (template.id)}
          <li>
            <NoteTemplateCard
              {template}
              loading={applyingTemplateId === template.id}
              onUse={() => handleUseBuiltIn(template.id)}
            />
          </li>
        {/each}
      </ul>

      <section class="space-y-4">
        <div>
          <h2 class="text-base font-semibold">{$t('docs.templates.your_templates_heading')}</h2>
          <p class="ui:text-muted-foreground mt-1 text-sm">{$t('docs.templates.your_templates_description')}</p>
        </div>

        {#if docsApi.isLoading && docsApi.templates.length === 0}
          <div class="flex justify-center py-8">
            <Spinner />
          </div>
        {:else if docsApi.templates.length === 0}
          <p class="ui:text-muted-foreground text-sm">{$t('docs.templates.your_templates_empty')}</p>
        {:else}
          <ul class="grid gap-3 sm:grid-cols-2">
            {#each docsApi.templates as template (template.id)}
              <li>
                <Card.Root class="ui:hover:border-primary/40 ui:hover:bg-muted/30 h-full transition-colors">
                  <Card.Header class="gap-3">
                    <Card.Title class="line-clamp-2 text-sm leading-snug">
                      {displayNoteTitle(template.title)}
                    </Card.Title>
                    <Card.Description class="line-clamp-3 text-xs">
                      {notePreviewText(template)}
                    </Card.Description>
                    <Button
                      size="sm"
                      variant="secondary"
                      class="w-full"
                      loading={applyingTemplateId === template.id}
                      onclick={() => handleUseOrgTemplate(template.id)}
                    >
                      {$t('docs.templates.use_template')}
                    </Button>
                  </Card.Header>
                </Card.Root>
              </li>
            {/each}
          </ul>
        {/if}
      </section>
    </div>
  </div>
</div>
