<script lang="ts">
  import { ACCENT_COLORS } from '@cio/certificates';
  import { t } from '$lib/utils/functions/translations';
  import { cn } from '@cio/ui/tools';

  interface Props {
    value: string;
    onSelect: (color: string) => void;
    disabled?: boolean;
  }

  let { value, onSelect, disabled = false }: Props = $props();
</script>

<div class="space-y-3">
  <div class="grid grid-cols-6 gap-2">
    {#each ACCENT_COLORS as color (color)}
      {@const isActive = color.toLowerCase() === value.toLowerCase()}
      <button
        type="button"
        class={cn(
          'ui:border-border relative aspect-square rounded-md border transition-transform',
          'hover:-translate-y-0.5',
          isActive && 'ui:ring-foreground ring-2 ring-offset-2',
          disabled && 'cursor-not-allowed opacity-60 hover:translate-y-0'
        )}
        style:background-color={color}
        aria-label={color}
        aria-pressed={isActive}
        {disabled}
        onclick={() => onSelect(color)}
      ></button>
    {/each}
  </div>

  <p class="ui:text-muted-foreground text-xs">
    {$t('course.navItem.certificates.editor.accent_hint')}
  </p>
</div>
