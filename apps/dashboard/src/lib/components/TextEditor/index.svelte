<script lang="ts">
  import Editor from './TinymceSvelte/index.svelte';
  import { globalStore } from '$lib/utils/store/app';
  import { addMathPlugin } from '$lib/utils/functions/tinymce/plugins';

  export let id = '';
  export let value: string | undefined = '';
  export let onChange = (html: string) => {};
  export let height = 300;
  export let placeholder = '';
  export let editorWindowRef: Window | undefined = undefined;
  export let maxHeight: number | undefined = undefined;

  let unmount = false;
  let editorChangeHandlerId;

  function getTinymce() {
    const getSink = () => {
      return typeof window !== 'undefined' ? window : global;
    };
    const sink = getSink();
    const res = sink && sink.tinymce ? sink.tinymce : null;
    console.log({ res });
    return res;
  }

  // editor configuration
  let conf = {
    plugins: 'lists, link, emoticons, code, media, eqneditor',
    toolbar: [
      { name: 'history', items: ['undo', 'redo'] },
      { name: 'styles', items: ['styles'] },
      { name: 'formatting', items: ['bold', 'italic'] },
      { name: 'alignment', items: ['alignleft', 'aligncenter', 'alignright', 'alignjustify'] },
      { name: 'indentation', items: ['outdent', 'indent'] },
      { name: 'list', items: ['numlist', 'bullist'] },
      { name: 'link', items: ['link'] },
      { name: 'insert', items: ['emoticons'] },
      { name: 'code', items: ['code'] },
      { name: 'media', items: ['media'] },
      { name: 'eqneditor', items: ['eqneditor'] }
    ],
    lists_indent_on_tab: false,
    min_height: height,
    max_height: maxHeight,
    placeholder: placeholder,
    skin: 'oxide-dark',
    content_css: 'dark',
    extended_valid_elements: '*[.*]',
    license_key: 'gpl',
    setup: () => {
      addMathPlugin(getTinymce());
    },
    init_instance_callback: function (editor: any) {
      editorWindowRef = editor.iframeElement?.contentWindow;

      editor.on('Paste Change input Undo Redo', function () {
        clearTimeout(editorChangeHandlerId);

        editorChangeHandlerId = setTimeout(function () {
          console.log('changed');
          const html = editor.getContent();
          if (onChange) {
            onChange(html);
          }

          if (id) {
            localStorage.setItem(id, html);
          }
        }, 1000);
      });
    }
  };

  function handleModeChange(isDark: boolean) {
    if (isDark) {
      conf.content_css = 'dark';
      conf.skin = 'oxide-dark';
    } else {
      conf.content_css = 'light';
      conf.skin = 'oxide';
    }

    unmount = true;
    setTimeout(() => {
      unmount = false;
    }, 200);
  }

  $: value = !value ? '' : value;

  $: handleModeChange($globalStore.isDark);
</script>

<svelte:head>
  <link rel="stylesheet" href="https://unpkg.com/katex@0.12.0/dist/katex.min.css" />
</svelte:head>

<div>
  {#if !unmount}
    <Editor bind:value bind:conf />
  {/if}
</div>
