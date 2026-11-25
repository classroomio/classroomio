<script lang="ts">
  import FlagIcon from '@lucide/svelte/icons/flag';
  import FlagOffIcon from '@lucide/svelte/icons/flag-off';
  import { IconButton } from '@cio/ui/custom/icon-button';
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

<IconButton
  size="icon-sm"
  class={cn('h-8 w-8', required ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400')}
  tooltip={actionLabel}
  tooltipSide="top"
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
</IconButton>
