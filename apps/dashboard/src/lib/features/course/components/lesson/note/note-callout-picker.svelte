<script lang="ts">
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import * as Tooltip from '@cio/ui/base/tooltip';
  import { Button } from '@cio/ui/base/button';
  import LayoutGridIcon from '@lucide/svelte/icons/layout-grid';
  import { t } from '$lib/utils/functions/translations';
  import { NOTE_CALLOUT_BUTTON_KEY, NOTE_CALLOUT_OPTIONS, type NoteCalloutStyle } from './note-callout';

  interface Props {
    value: NoteCalloutStyle;
    onChange: (style: NoteCalloutStyle) => void;
  }

  let { value, onChange }: Props = $props();

  const label = $derived($t(NOTE_CALLOUT_BUTTON_KEY));
</script>

<Tooltip.Provider delayDuration={300}>
  <Tooltip.Root>
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        {#snippet child({ props })}
          <Tooltip.Trigger {...props}>
            {#snippet child({ props: tipProps })}
              <Button
                {...tipProps}
                variant="ghost"
                size="icon"
                class={value ? 'ui:bg-muted' : ''}
                aria-label={label}
                testId="note-callout-style"
              >
                <LayoutGridIcon />
              </Button>
            {/snippet}
          </Tooltip.Trigger>
        {/snippet}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end" class="min-w-[168px]">
        {#each NOTE_CALLOUT_OPTIONS as option (option.id)}
          <DropdownMenu.Item
            class={value === option.id ? 'ui:bg-accent' : ''}
            aria-checked={value === option.id}
            onclick={() => onChange(option.id)}
          >
            <span class="size-2 shrink-0 rounded-full {option.dotClass}"></span>
            <span>{$t(option.labelKey)}</span>
          </DropdownMenu.Item>
        {/each}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
    <Tooltip.Content side="bottom">{label}</Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>
