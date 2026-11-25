<script lang="ts">
  import FlagIcon from '@lucide/svelte/icons/flag';
  import FlagOffIcon from '@lucide/svelte/icons/flag-off';
  import { Button } from '@cio/ui/base/button';
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

<Button
  size="sm"
  variant="outline"
  class={cn(
    'h-8 gap-1.5 px-2 text-xs font-semibold',
    required
      ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950 dark:text-red-300'
      : 'border-dashed text-gray-500 dark:text-gray-400'
  )}
  {disabled}
  aria-pressed={required}
  aria-label={actionLabel}
  title={actionLabel}
  testId="lessons-requirement-toggle"
  onclick={onToggle}
>
  {#if required}
    <FlagIcon class="h-4 w-4 fill-current" />
    <span class="hidden sm:inline">{$t('course.navItem.lessons.requirement.required')}</span>
  {:else}
    <FlagOffIcon class="h-4 w-4" />
    <span class="hidden sm:inline">{$t('course.navItem.lessons.requirement.optional')}</span>
  {/if}
</Button>
