<script lang="ts">
  import { cn } from '../../tools';
  import * as Popover from '../../base/popover';
  import * as Tabs from '../../base/tabs';
  import { Button } from '../../base/button';
  import MathInput from '../math-input/math-input.svelte';
  import MathStructurePalette from '../math-input/math-structure-palette.svelte';
  import type { MathKeyboard, MathLevel, MathStructure } from '../math-input/types';
  import MathImageInput from './math-image-input.svelte';
  import MathLatexField from './math-latex-field.svelte';
  import { getMathImageConverter } from './math-image';
  import type { MathEditLabels } from './types';

  interface Props {
    open: boolean;
    latex: string;
    /** Element the popover is positioned against, such as the clicked formula. */
    anchor: HTMLElement | null;
    labels: MathEditLabels;
    keyboard?: MathKeyboard;
    /** Highest level of structures the palette offers. */
    level?: MathLevel;
    /** Called with the edited LaTeX on Done, Enter or a click outside. */
    onSave: (latex: string) => void;
    /** Called on Cancel or Escape. */
    onCancel: () => void;
  }

  let {
    open = $bindable(false),
    latex = $bindable(''),
    anchor,
    labels,
    keyboard = 'full',
    level = 'advanced',
    onSave,
    onCancel
  }: Props = $props();

  const imageConverter = getMathImageConverter();

  const MATHLIVE_OVERLAYS = '.ML__keyboard, .MLK__variant-panel, .ui-menu-container';

  let isEscapeDismissal = false;
  let activeTab = $state('type');
  const isImageTab = $derived(activeTab === 'photo' || activeTab === 'draw');
  let mathInput = $state<ReturnType<typeof MathInput> | null>(null);

  function save() {
    open = false;
    onSave(latex);
  }

  function cancel() {
    open = false;
    onCancel();
  }

  function insertConverted(converted: string) {
    latex = converted;
    save();
  }

  function insertStructure(structure: MathStructure) {
    mathInput?.insert(structure.insert);
  }

  function handleInteractOutside(event: PointerEvent) {
    if (!(event.target instanceof Element) || !event.target.closest(MATHLIVE_OVERLAYS)) return;

    event.preventDefault();
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
    class={cn('ui:max-w-[calc(100vw-2rem)]', isImageTab ? 'ui:w-[34rem]' : 'ui:w-96')}
    onEscapeKeydown={() => (isEscapeDismissal = true)}
    onInteractOutside={handleInteractOutside}
    onOpenAutoFocus={(event) => event.preventDefault()}
    onCloseAutoFocus={(event) => event.preventDefault()}
  >
    <div class="ui:space-y-3">
      <Tabs.Root bind:value={activeTab}>
        <Tabs.List>
          <Tabs.Trigger value="type">{labels.typeTab}</Tabs.Trigger>
          <Tabs.Trigger value="latex">{labels.latexTab}</Tabs.Trigger>
          {#if imageConverter}
            <Tabs.Trigger value="photo">{imageConverter.labels.photoTab}</Tabs.Trigger>
            <Tabs.Trigger value="draw">{imageConverter.labels.drawTab}</Tabs.Trigger>
          {/if}
        </Tabs.List>

        <Tabs.Content value="type" class="ui:space-y-2">
          <MathStructurePalette
            {level}
            labels={labels.structures}
            ariaLabel={labels.paletteLabel}
            onSelect={insertStructure}
          />
          <MathInput
            bind:this={mathInput}
            bind:value={latex}
            {keyboard}
            autofocus
            ariaLabel={labels.mathFieldLabel}
            onSubmit={save}
          />
        </Tabs.Content>

        <Tabs.Content value="latex">
          <MathLatexField bind:value={latex} {labels} onSubmit={save} />
        </Tabs.Content>

        {#if imageConverter}
          <Tabs.Content value="photo">
            <MathImageInput mode="photo" converter={imageConverter} {keyboard} onInsert={insertConverted} />
          </Tabs.Content>
          <Tabs.Content value="draw">
            <MathImageInput mode="draw" converter={imageConverter} {keyboard} onInsert={insertConverted} />
          </Tabs.Content>
        {/if}
      </Tabs.Root>

      {#if !isImageTab}
        <div class="ui:flex ui:justify-end ui:gap-2">
          <Button type="button" variant="outline" size="sm" onclick={cancel}>{labels.cancel}</Button>
          <Button type="button" size="sm" onclick={save}>{labels.done}</Button>
        </div>
      {/if}
    </div>
  </Popover.Content>
</Popover.Root>
