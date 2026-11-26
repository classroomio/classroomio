<script lang="ts">
  import * as Tooltip from '@cio/ui/base/tooltip';
  import { cn } from '@cio/ui/tools';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    testId?: string;
    class?: string;
  }

  let { testId = 'lessons-requirement-marker', class: className = '' }: Props = $props();

  const label = $derived($t('course.navItem.lessons.requirement.required'));
</script>

<Tooltip.Provider>
  <Tooltip.Root>
    <Tooltip.Trigger>
      {#snippet child({ props })}
        <span
          {...props}
          role="img"
          aria-label={label}
          data-testid={testId}
          class={cn(
            'shrink-0 cursor-help px-0.5 text-sm leading-none font-bold text-red-600 dark:text-red-400',
            className
          )}
        >
          *
        </span>
      {/snippet}
    </Tooltip.Trigger>
    <Tooltip.Content side="top">{label}</Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>
