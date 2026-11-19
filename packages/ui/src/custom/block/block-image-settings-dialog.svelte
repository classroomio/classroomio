<script lang="ts">
  import { Button } from '../../base/button';
  import * as DialogPrimitives from '../../base/dialog';
  import * as ToggleGroup from '../../base/toggle-group';
  import { InputField } from '../input-field';
  import type { ImageBlockFit, ImageBlockSettings } from './types';

  interface Props {
    open: boolean;
    alt: string;
    fit: ImageBlockFit;
    titleLabel?: string;
    altLabel?: string;
    altPlaceholder?: string;
    fitLabel?: string;
    fitCoverLabel?: string;
    fitContainLabel?: string;
    cancelLabel?: string;
    saveLabel?: string;
    onSave: (settings: ImageBlockSettings) => void;
  }

  let {
    open = $bindable(false),
    alt,
    fit,
    titleLabel = 'Image settings',
    altLabel = 'Alt text',
    altPlaceholder = 'Describe the image for screen readers',
    fitLabel = 'Fit',
    fitCoverLabel = 'Cover',
    fitContainLabel = 'Contain',
    cancelLabel = 'Cancel',
    saveLabel = 'Save changes',
    onSave
  }: Props = $props();

  let altDraft = $state(alt);
  let fitDraft = $state<ImageBlockFit>(fit);

  function handleOpenChange(isOpen: boolean) {
    open = isOpen;
    if (!isOpen) return;

    altDraft = alt;
    fitDraft = fit;
  }

  function save() {
    onSave({ alt: altDraft.trim(), fit: fitDraft });
    open = false;
  }
</script>

<DialogPrimitives.Root {open} onOpenChange={handleOpenChange}>
  <DialogPrimitives.Content class="ui:sm:max-w-md">
    <DialogPrimitives.Header>
      <DialogPrimitives.Title>{titleLabel}</DialogPrimitives.Title>
    </DialogPrimitives.Header>

    <div class="ui:space-y-4 ui:py-2">
      <InputField label={altLabel} placeholder={altPlaceholder} bind:value={altDraft} />

      <div class="ui:space-y-2">
        <p class="ui:text-sm ui:font-medium">{fitLabel}</p>
        <ToggleGroup.Root
          type="single"
          variant="outline"
          size="sm"
          value={fitDraft}
          onValueChange={(value) => (fitDraft = value as ImageBlockFit)}
        >
          <ToggleGroup.Item value="cover">{fitCoverLabel}</ToggleGroup.Item>
          <ToggleGroup.Item value="contain">{fitContainLabel}</ToggleGroup.Item>
        </ToggleGroup.Root>
      </div>
    </div>

    <DialogPrimitives.Footer>
      <Button variant="outline" size="sm" onclick={() => (open = false)}>{cancelLabel}</Button>
      <Button size="sm" onclick={save}>{saveLabel}</Button>
    </DialogPrimitives.Footer>
  </DialogPrimitives.Content>
</DialogPrimitives.Root>
