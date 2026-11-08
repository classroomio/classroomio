<script lang="ts">
  import * as Block from '@cio/ui/custom/block';
  import * as Select from '@cio/ui/base/select';
  import { TextEditor } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';
  import type { TiptapEditor } from '@cio/ui/custom/editor';
  import type { TNoteBlockStyle } from '@cio/utils/validation/block';
  import { NOTE_STYLE_OPTIONS, noteStyleLabelKey } from './note-styles';
  import type { BlockEditProps } from '../../utils/types';

  let { block, content, locale, onDataChange, onContentChange }: BlockEditProps<'note'> = $props();

  let editorInstance = $state<TiptapEditor>();
  let loadedLocale = '';

  const style = $derived(block.data.style ?? 'default');

  $effect(() => {
    if (locale === loadedLocale) return;

    loadedLocale = locale;
    editorInstance?.commands.setContent(content);
  });

  function handleStyleChange(value: string) {
    onDataChange({ ...block.data, style: value as TNoteBlockStyle });
  }
</script>

<div class="mb-2 flex justify-end">
  <Select.Root type="single" value={style} onValueChange={handleStyleChange}>
    <Select.Trigger size="sm" aria-label={$t('course.navItem.lessons.materials.blocks.note_style')}>
      {$t(noteStyleLabelKey(style))}
    </Select.Trigger>
    <Select.Content>
      {#each NOTE_STYLE_OPTIONS as option (option.value)}
        <Select.Item value={option.value} label={$t(option.labelKey)}>{$t(option.labelKey)}</Select.Item>
      {/each}
    </Select.Content>
  </Select.Root>
</div>

<Block.Note {style} editable styleLabel={$t(noteStyleLabelKey(style))}>
  {#snippet editor()}
    <TextEditor
      {content}
      class="ui:z-0 z-0 min-h-[250px]"
      onChange={(nextContent: unknown) => onContentChange(`${nextContent}`)}
      onReady={(nextEditor) => (editorInstance = nextEditor)}
      placeholder={$t('course.navItem.lessons.materials.tabs.note.placeholder')}
    />
  {/snippet}
</Block.Note>
