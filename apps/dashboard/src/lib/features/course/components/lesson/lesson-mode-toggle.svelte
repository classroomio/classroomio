<script lang="ts">
  import { browser } from '$app/environment';
  import Eye from '@lucide/svelte/icons/eye';
  import Pencil from '@lucide/svelte/icons/pencil';
  import * as Tabs from '@cio/ui/base/tabs';
  import * as Tooltip from '@cio/ui/base/tooltip';
  import * as Kbd from '@cio/ui/base/kbd';
  import { Separator } from '@cio/ui/base/separator';
  import MODES from '$lib/utils/constants/mode';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    mode: string;
    disabled?: boolean;
    class?: string;
    onToggle: () => void;
  }

  let { mode, disabled = false, class: className = '', onToggle }: Props = $props();

  const isMac = $derived(browser && /Mac|iPhone|iPad|iPod/.test(navigator.platform));
  const modifierLabel = $derived(isMac ? '⌘' : 'Ctrl');

  function isModeShortcut(event: KeyboardEvent) {
    const hasModifier = isMac ? event.metaKey : event.ctrlKey;

    return hasModifier && !event.shiftKey && !event.altKey && event.code === 'Slash';
  }

  function isInsideDialog() {
    return document.activeElement?.closest('[role="dialog"], [role="alertdialog"]') != null;
  }

  function handleWindowKeydown(event: KeyboardEvent) {
    if (!isModeShortcut(event)) return;

    event.preventDefault();

    if (event.repeat || disabled || isInsideDialog()) return;

    onToggle();
  }
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<Tooltip.Provider>
  <Tooltip.Root>
    <Tooltip.Trigger>
      {#snippet child({ props })}
        <div {...props} class={className}>
          <Tabs.Root
            value={mode}
            onValueChange={(next) => {
              if (next !== mode) onToggle();
            }}
          >
            <Tabs.List
              aria-label={$t('course.navItem.lessons.header.mode_label')}
              aria-keyshortcuts={isMac ? 'Meta+/' : 'Control+/'}
            >
              <Tabs.Trigger value={MODES.view} {disabled} data-testid="lesson-mode-preview">
                <Eye />
                {$t('course.navItem.lessons.header.mode_preview')}
              </Tabs.Trigger>
              <Tabs.Trigger value={MODES.edit} {disabled} data-testid="lesson-mode-edit">
                <Pencil />
                {$t('course.navItem.lessons.header.mode_edit')}
              </Tabs.Trigger>
            </Tabs.List>
          </Tabs.Root>
        </div>
      {/snippet}
    </Tooltip.Trigger>
    <Tooltip.Content side="bottom">
      <span class="flex items-center gap-2">
        {$t('course.navItem.lessons.header.mode_shortcut')}
        <Separator orientation="vertical" class="h-4! bg-current opacity-30" />
        <Kbd.Group>
          <Kbd.Root>{modifierLabel}</Kbd.Root>
          <Kbd.Root>/</Kbd.Root>
        </Kbd.Group>
      </span>
    </Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>
