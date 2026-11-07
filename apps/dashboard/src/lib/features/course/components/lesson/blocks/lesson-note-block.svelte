<script lang="ts">
  import { NoteBlock } from '@cio/ui';
  import { SafeHtmlContent } from '@cio/ui/custom/safe-html-content';
  import { HTMLRender, TextEditor } from '$features/ui';
  import { isHtmlValueEmpty } from '$lib/utils/functions/toHtml';
  import { t } from '$lib/utils/functions/translations';
  import MODES from '$lib/utils/constants/mode';
  import { lessonApi } from '$features/course/api';
  import { lessonBlocksApi } from '$features/course/store/lesson-blocks.svelte';
  import type { TiptapEditor } from '@cio/ui/custom/editor';
  import type { LessonNoteBlock, LessonNoteBlockStyle } from '$features/course/utils/types';

  interface Props {
    block: LessonNoteBlock;
    mode: (typeof MODES)[keyof typeof MODES];
  }

  let { block, mode }: Props = $props();

  const styleLabelKeys: Record<LessonNoteBlockStyle, string> = {
    default: 'course.navItem.lessons.materials.blocks.styles.default',
    info: 'course.navItem.lessons.materials.blocks.styles.info',
    tip: 'course.navItem.lessons.materials.blocks.styles.tip',
    important: 'course.navItem.lessons.materials.blocks.styles.important',
    warning: 'course.navItem.lessons.materials.blocks.styles.warning',
    highlight: 'course.navItem.lessons.materials.blocks.styles.highlight'
  };

  let editorInstance = $state<TiptapEditor>();
  let loadedLocale = '';

  const locale = $derived(lessonApi.currentLocale);
  const content = $derived(lessonBlocksApi.getNoteContent(block.id, locale));
  const contentIsEmpty = $derived(isHtmlValueEmpty(content));
  const styleLabel = $derived(t.get(styleLabelKeys[block.style]));

  $effect(() => {
    if (locale === loadedLocale) return;

    loadedLocale = locale;
    if (editorInstance) editorInstance.commands.setContent(content);
  });

  function handleEditorChange(nextContent: unknown) {
    lessonBlocksApi.setNoteContent(block.id, locale, `${nextContent}`);
  }
</script>

<NoteBlock
  style={block.style}
  editable={mode === MODES.edit}
  contentHtml={content}
  empty={contentIsEmpty}
  {styleLabel}
  emptyLabel={$t('course.navItem.lessons.materials.blocks.empty_note')}
>
  {#snippet editor()}
    <TextEditor
      {content}
      class="ui:z-0 z-0 min-h-[250px]"
      onChange={handleEditorChange}
      onReady={(nextEditor) => (editorInstance = nextEditor)}
      placeholder={$t('course.navItem.lessons.materials.tabs.note.placeholder')}
    />
  {/snippet}

  {#snippet view()}
    <HTMLRender>
      <SafeHtmlContent {content} />
    </HTMLRender>
  {/snippet}
</NoteBlock>
