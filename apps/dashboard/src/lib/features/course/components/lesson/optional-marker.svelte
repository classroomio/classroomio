<script lang="ts">
  import * as Tooltip from '@cio/ui/base/tooltip';
  import { cn } from '@cio/ui/tools';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    testId?: string;
    class?: string;
  }

  let { testId = 'sidebar-optional-marker', class: className = '' }: Props = $props();

  const label = $derived($t('course.navItem.lessons.requirement.optional'));
</script>

<Tooltip.Provider>
  <Tooltip.Root>
    <Tooltip.Trigger>
      {#snippet child({ props })}
        <span {...props} role="img" aria-label={label} data-testid={testId} class="shrink-0 cursor-help px-1 py-1">
          <span class={cn('ui:bg-muted-foreground/60 block size-1.5 rounded-full', className)}></span>
        </span>
      {/snippet}
    </Tooltip.Trigger>
    <Tooltip.Content side="top">{label}</Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>
