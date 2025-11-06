<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import type { EdraEditorProps } from '../types';
  import initEditor from '../editor';
  import { focusEditor } from '../utils';
  import { cn } from '$src/tools';
  import { ImagePlaceholder } from '../extensions/image/ImagePlaceholder';
  import ImagePlaceholderComp from './components/ImagePlaceholder.svelte';
  import { ImageExtended } from '../extensions/image/ImageExtended';
  import ImageExtendedComp from './components/ImageExtended.svelte';
  import { VideoPlaceholder } from '../extensions/video/VideoPlaceholder';
  import VideoPlaceHolderComp from './components/VideoPlaceholder.svelte';
  import { VideoExtended } from '../extensions/video/VideoExtended';
  import VideoExtendedComp from './components/VideoExtended.svelte';
  import { AudioPlaceholder } from '../extensions/audio/AudioPlaceholder';
  import { AudioExtended } from '../extensions/audio/AudiExtended';
  import AudioPlaceHolderComp from './components/AudioPlaceHolder.svelte';
  import AudioExtendedComp from './components/AudioExtended.svelte';
  import { IFramePlaceholder } from '../extensions/iframe/IFramePlaceholder';
  import { IFrameExtended } from '../extensions/iframe/IFrameExtended';
  import IFramePlaceHolderComp from './components/IFramePlaceHolder.svelte';
  import IFrameExtendedComp from './components/IFrameExtended.svelte';
  import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
  import { all, createLowlight } from 'lowlight';
  import { SvelteNodeViewRenderer } from 'svelte-tiptap';
  import CodeBlock from './components/CodeBlock.svelte';
  import TableCol from './menus/TableCol.svelte';
  import TableRow from './menus/TableRow.svelte';
  import Link from './menus/Link.svelte';
  import slashcommand from '../extensions/slash-command/slashcommand';
  import SlashCommandList from './components/SlashCommandList.svelte';

  import '../editor.css';
  import './style.css';
  import '../onedark.css';
  import { Placeholder } from '@tiptap/extensions';

  const lowlight = createLowlight(all);

  /**
   * Bind the element to the editor
   */
  let element = $state<HTMLElement>();
  let {
    editor = $bindable(),
    editable = true,
    content,
    onUpdate,
    autofocus = false,
    class: className,
    placeholder = ''
  }: EdraEditorProps = $props();

  onMount(() => {
    editor = initEditor(
      element,
      content,
      [
        CodeBlockLowlight.configure({
          lowlight
        }).extend({
          addNodeView() {
            return SvelteNodeViewRenderer(CodeBlock);
          }
        }),
        ImagePlaceholder(ImagePlaceholderComp),
        ImageExtended(ImageExtendedComp),
        VideoPlaceholder(VideoPlaceHolderComp),
        VideoExtended(VideoExtendedComp),
        AudioPlaceholder(AudioPlaceHolderComp),
        AudioExtended(AudioExtendedComp),
        IFramePlaceholder(IFramePlaceHolderComp),
        IFrameExtended(IFrameExtendedComp),
        slashcommand(SlashCommandList),
        Placeholder.configure({
          placeholder
        })
      ],
      {
        onUpdate,
        onTransaction(props) {
          editor = undefined;
          editor = props.editor;
        },
        editable,
        autofocus
      },
      placeholder
    );
  });

  onDestroy(() => {
    if (editor) editor.destroy();
  });
</script>

{#if editor && !editor.isDestroyed}
  <Link {editor} />
  <TableCol {editor} />
  <TableRow {editor} />
{/if}
<div
  bind:this={element}
  role="button"
  tabindex="0"
  onclick={(event) => focusEditor(editor, event)}
  onkeydown={(event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      focusEditor(editor, event);
    }
  }}
  class={cn('edra-editor h-full w-full cursor-auto px-4 *:outline-none', className)}
></div>
