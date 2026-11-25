<script lang="ts">
  import FlagIcon from '@lucide/svelte/icons/flag';
  import FlagOffIcon from '@lucide/svelte/icons/flag-off';
  import { Button } from '@cio/ui/base/button';
  import * as Tooltip from '@cio/ui/base/tooltip';
  import { cn } from '@cio/ui/tools';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    required: boolean;
    disabled?: boolean;
    onToggle: () => void;
  }

  let { required, disabled = false, onToggle }: Props = $props();

  const actionLabel = $derived(
    required
      ? $t('course.navItem.lessons.requirement.make_optional')
      : $t('course.navItem.lessons.requirement.make_required')
  );
</script>

<Tooltip.Provider>
  <Tooltip.Root>
    <Tooltip.Trigger>
      {#snippet child({ props })}
        <Button
          {...props}
          variant="secondary"
          size="icon-sm"
          class={cn(
            'h-8 w-8 opacity-0 transition-opacity group-focus-within/card:opacity-100 group-hover/card:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100',
            required ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
          )}
          aria-label={actionLabel}
          aria-pressed={required}
          {disabled}
          testId="lessons-requirement-toggle"
          onclick={onToggle}
        >
          {#if required}
            <FlagIcon class="h-4 w-4 fill-current" />
          {:else}
            <FlagOffIcon class="h-4 w-4" />
          {/if}
        </Button>
      {/snippet}
    </Tooltip.Trigger>
    <Tooltip.Content side="top">{actionLabel}</Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>
