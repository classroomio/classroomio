<script lang="ts">
  import type { CourseTemplate } from '@cio/utils/constants/note-course-templates';
  import * as Card from '@cio/ui/base/card';
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

<Card.Root class={cn('ui:hover:border-primary/40 ui:hover:bg-muted/30 h-full transition-colors', className)}>
  <Card.Header class="gap-3">
    <div class="flex items-start gap-3">
      <div
        class={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-lg',
          template.gradient
        )}
        aria-hidden="true"
      >
        {template.emoji}
      </div>
      <div class="min-w-0 flex-1 space-y-1">
        <Card.Title class="line-clamp-2 text-sm leading-snug">{template.title}</Card.Title>
        <p class="ui:text-muted-foreground text-xs font-medium">
          {$t('docs.templates.modules_included', { count: template.modules.length })}
        </p>
      </div>
    </div>

    <Card.Description class="line-clamp-3 text-xs">{template.description}</Card.Description>

    <Button size="sm" variant="secondary" class="w-full" {loading} onclick={() => onUse?.()}>
      {$t('docs.templates.use_template')}
    </Button>
  </Card.Header>
</Card.Root>
