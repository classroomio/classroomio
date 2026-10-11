<script lang="ts">
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import * as Tooltip from '@cio/ui/base/tooltip';
  import { Button } from '@cio/ui/base/button';
  import LayoutGridIcon from '@lucide/svelte/icons/layout-grid';
  import { t } from '$lib/utils/functions/translations';
  import {
    NOTE_CALLOUT_BUTTON_KEY,
    NOTE_CALLOUT_OPTIONS,
    NOTE_CALLOUT_STYLES,
    type NoteCalloutStyle,
    type NoteCalloutStyleId
  } from './note-callout';

  interface Props {
    value: NoteCalloutStyle;
    onChange: (style: NoteCalloutStyle) => void;
  }

  let { value, onChange }: Props = $props();

  const DEFAULT_RADIO_VALUE = 'default';

  const label = $derived($t(NOTE_CALLOUT_BUTTON_KEY));
  const radioValue = $derived(value || DEFAULT_RADIO_VALUE);

  function selectStyle(next: string) {
    if (next === DEFAULT_RADIO_VALUE) {
      onChange('');
      return;
    }

    if (!NOTE_CALLOUT_STYLES.includes(next as NoteCalloutStyleId)) return;

    onChange(next as NoteCalloutStyle);
  }
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
        <DropdownMenu.RadioGroup value={radioValue} onValueChange={selectStyle}>
          {#each NOTE_CALLOUT_OPTIONS as option (option.id || DEFAULT_RADIO_VALUE)}
            <DropdownMenu.RadioItem value={option.id || DEFAULT_RADIO_VALUE}>
              <span class="size-2 shrink-0 rounded-full {option.dotClass}"></span>
              <span>{$t(option.labelKey)}</span>
            </DropdownMenu.RadioItem>
          {/each}
        </DropdownMenu.RadioGroup>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
    <Tooltip.Content side="bottom">{label}</Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>
