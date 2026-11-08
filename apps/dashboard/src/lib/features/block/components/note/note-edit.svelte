<script lang="ts">
  import * as Block from '@cio/ui/custom/block';
  import { TextEditor } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';
  import type { TiptapEditor } from '@cio/ui/custom/editor';
  import type { BlockEditProps } from '../../utils/types';

  let { content, locale, onContentChange }: BlockEditProps<'note'> = $props();

  let editorInstance = $state<TiptapEditor>();
  let loadedLocale = '';

  $effect(() => {
    if (locale === loadedLocale) return;

    loadedLocale = locale;
    editorInstance?.commands.setContent(content);
  });
</script>

<Block.Note editable>
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
