<script lang="ts">
  import type { Snippet } from 'svelte';
  import * as Field from '@cio/ui/base/field';
  import { DisplaySectionToggle, TextEditor } from '$features/ui';

  interface Props {
    title: string;
    content?: string;
    show?: boolean;
    onChange: (content: string) => void;
    onToggleShow: (show: boolean) => void;
    headerAction?: Snippet;
  }

  let { title, content = '', show = true, onChange, onToggleShow, headerAction }: Props = $props();
</script>

<Field.Group>
  <Field.Set>
    <Field.Field>
      <div class="mb-2 flex items-center justify-between">
        <Field.Label>{title}</Field.Label>
        {#if headerAction}
          {@render headerAction()}
        {/if}
      </div>
      <TextEditor {content} {onChange} />
    </Field.Field>
  </Field.Set>
</Field.Group>

<DisplaySectionToggle {show} toggleId="rich-text-section-toggle" {onToggleShow} />
