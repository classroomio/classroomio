<script lang="ts">
  import type { CourseTemplate } from '@cio/utils/constants/note-course-templates';
  import { Button } from '@cio/ui/base/button';
  import { cn } from '@cio/ui/tools';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    template: CourseTemplate;
    loading?: boolean;
    onUse?: () => void | Promise<void>;
    class?: string;
  }

  let { template, loading = false, onUse, class: className = '' }: Props = $props();
</script>

<article class={cn('border-border flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm', className)}>
  <div class={cn('flex h-28 items-center justify-center bg-gradient-to-br text-4xl', template.gradient)}>
    <span aria-hidden="true">{template.emoji}</span>
  </div>

  <div class="flex flex-1 flex-col gap-3 p-4">
    <div class="space-y-2">
      <h3 class="text-lg font-semibold">{template.title}</h3>
      <p class="ui:text-muted-foreground text-sm leading-relaxed">{template.description}</p>
      <p class="ui:text-muted-foreground text-xs font-medium">
        {$t('notes.templates.modules_included', { count: template.modules.length })}
      </p>
    </div>

    <Button class="mt-auto w-full" {loading} onclick={() => onUse?.()}>
      {$t('notes.templates.use_template')}
    </Button>
  </div>
</article>
