<script lang="ts">
  import * as Popover from '../../base/popover';
  import { Button } from '../../base/button';
  import MathLatexField from './math-latex-field.svelte';
  import type { MathEditLabels } from './types';

  interface Props {
    open: boolean;
    latex: string;
    /** Element the popover is positioned against, such as the clicked formula. */
    anchor: HTMLElement | null;
    labels: MathEditLabels;
    /** Called with the edited LaTeX on Done, Enter or a click outside. */
    onSave: (latex: string) => void;
    /** Called on Cancel or Escape. */
    onCancel: () => void;
  }

  let { open = $bindable(false), latex = $bindable(''), anchor, labels, onSave, onCancel }: Props = $props();

  let isEscapeDismissal = false;

  function save() {
    open = false;
    onSave(latex);
  }

  function cancel() {
    open = false;
    onCancel();
  }

  function handleOpenChange(isOpen: boolean) {
    if (isOpen) return;

    const dismissedWithEscape = isEscapeDismissal;
    isEscapeDismissal = false;

    if (dismissedWithEscape) {
      onCancel();
      return;
    }

    onSave(latex);
  }
</script>

<Popover.Root bind:open onOpenChange={handleOpenChange}>
  <Popover.Content
    customAnchor={anchor}
    side="bottom"
    align="start"
    class="ui:w-80"
    onEscapeKeydown={() => (isEscapeDismissal = true)}
    onCloseAutoFocus={(event) => event.preventDefault()}
  >
    <div class="ui:space-y-3">
      <MathLatexField bind:value={latex} {labels} onSubmit={save} />

      <div class="ui:flex ui:justify-end ui:gap-2">
        <Button type="button" variant="outline" size="sm" onclick={cancel}>{labels.cancel}</Button>
        <Button type="button" size="sm" onclick={save}>{labels.done}</Button>
      </div>
    </div>
  </Popover.Content>
</Popover.Root>
