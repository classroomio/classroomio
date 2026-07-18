<script lang="ts">
  import LayoutTemplateIcon from '@lucide/svelte/icons/layout-template';
  import * as Card from '@cio/ui/base/card';
  import { cn } from '@cio/ui/tools';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    noteHref?: (noteId: string) => string;
    class?: string;
  }

  let { noteHref, class: className = '' }: Props = $props();

  const templates = $derived([] as { id: string; title: string }[]);
</script>

<section class={cn('flex flex-col gap-3', className)}>
  <div class="flex items-center justify-between gap-3">
    <h2 class="ui:text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase">
      {$t('notes.templates.heading')}
    </h2>
  </div>

  {#if templates.length === 0}
    <div
      class="ui:border-border ui:text-muted-foreground flex items-center gap-3 rounded-lg border border-dashed px-4 py-5 text-sm"
    >
      <LayoutTemplateIcon size={18} class="shrink-0" />
      <p>{$t('notes.templates.empty')}</p>
    </div>
  {:else}
    <div class="-mx-1 overflow-x-auto px-1 pb-1">
      <ul class="flex min-w-min gap-3">
        {#each templates as template (template.id)}
          <li class="w-52 shrink-0">
            {#if noteHref}
              <a href={noteHref(template.id)} class="block h-full">
                <Card.Root class="ui:hover:bg-muted/40 h-full transition-colors">
                  <Card.Header class="gap-2 pb-0">
                    <Card.Title class="line-clamp-2 text-sm leading-snug">{template.title}</Card.Title>
                  </Card.Header>
                </Card.Root>
              </a>
            {/if}
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</section>
