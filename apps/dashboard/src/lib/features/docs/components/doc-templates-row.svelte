<script lang="ts">
  import LayoutTemplateIcon from '@lucide/svelte/icons/layout-template';
  import * as Card from '@cio/ui/base/card';
  import { Button } from '@cio/ui/base/button';
  import { cn } from '@cio/ui/tools';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { currentOrg, currentOrgPath } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import { docsApi } from '../api';

  interface Props {
    class?: string;
  }

  let { class: className = '' }: Props = $props();
  let creatingTemplateId = $state<string | null>(null);

  function noteHref(docId: string) {
    return resolve(`${$currentOrgPath}/docs/${docId}`, {});
  }

  async function handleUseTemplate(templateId: string) {
    creatingTemplateId = templateId;
    const note = await docsApi.createDocFromTemplate(templateId);
    creatingTemplateId = null;

    if (!note) {
      snackbar.error('docs.templates.create_error');
      return;
    }

    snackbar.success('docs.templates.create_success');
    await goto(noteHref(note.id));
  }

  $effect(() => {
    if (!$profile.id || !$currentOrg.id) {
      return;
    }

    docsApi.listTemplates();
  });
</script>

<section class={cn('flex flex-col gap-3', className)}>
  <div class="flex items-center justify-between gap-3">
    <h2 class="ui:text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase">
      {$t('docs.templates.heading')}
    </h2>
  </div>

  {#if docsApi.templates.length === 0}
    <div
      class="ui:border-border ui:text-muted-foreground flex items-center gap-3 rounded-lg border border-dashed px-4 py-5 text-sm"
    >
      <LayoutTemplateIcon size={18} class="shrink-0" />
      <p>{$t('docs.templates.empty')}</p>
    </div>
  {:else}
    <div class="-mx-1 overflow-x-auto px-1 pb-1">
      <ul class="flex min-w-min gap-3">
        {#each docsApi.templates as template (template.id)}
          <li class="w-52 shrink-0">
            <Card.Root class="ui:hover:bg-muted/40 h-full transition-colors">
              <Card.Header class="gap-3 pb-0">
                <Card.Title class="line-clamp-2 text-sm leading-snug">{template.title}</Card.Title>
                <Button
                  size="sm"
                  variant="secondary"
                  class="w-full"
                  loading={creatingTemplateId === template.id}
                  onclick={() => handleUseTemplate(template.id)}
                >
                  {$t('docs.templates.use_template')}
                </Button>
              </Card.Header>
            </Card.Root>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</section>
