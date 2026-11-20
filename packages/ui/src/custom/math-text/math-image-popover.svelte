<script lang="ts">
  import CameraIcon from '@lucide/svelte/icons/camera';
  import * as Popover from '../../base/popover';
  import * as Tabs from '../../base/tabs';
  import { Button } from '../../base/button';
  import type { MathKeyboard } from '../math-input/types';
  import MathImageInput from './math-image-input.svelte';
  import { getMathImageConverter } from './math-image';

  interface Props {
    /** Called with the converted LaTeX the user chose to insert. */
    onInsert: (latex: string) => void;
    keyboard?: MathKeyboard;
    disabled?: boolean;
  }

  let { onInsert, keyboard = 'full', disabled = false }: Props = $props();

  const converter = getMathImageConverter();
  let open = $state(false);

  function handleInsert(latex: string) {
    open = false;
    onInsert(latex);
  }
</script>

{#if converter}
  <Popover.Root bind:open>
    <Popover.Trigger {disabled}>
      {#snippet child({ props })}
        <Button {...props} type="button" variant="outline" size="sm" {disabled}>
          <CameraIcon class="ui:size-4" />
          {converter.labels.fromImage}
        </Button>
      {/snippet}
    </Popover.Trigger>
    <Popover.Content class="ui:w-[34rem] ui:max-w-[calc(100vw-2rem)]" align="start">
      <Tabs.Root value="photo">
        <Tabs.List>
          <Tabs.Trigger value="photo">{converter.labels.photoTab}</Tabs.Trigger>
          <Tabs.Trigger value="draw">{converter.labels.drawTab}</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="photo">
          <MathImageInput mode="photo" {converter} {keyboard} onInsert={handleInsert} />
        </Tabs.Content>
        <Tabs.Content value="draw">
          <MathImageInput mode="draw" {converter} {keyboard} onInsert={handleInsert} />
        </Tabs.Content>
      </Tabs.Root>
    </Popover.Content>
  </Popover.Root>
{/if}
