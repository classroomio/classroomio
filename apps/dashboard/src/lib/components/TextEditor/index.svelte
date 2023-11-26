<script lang="ts">
  import { PUBLIC_TINYMCE_API_KEY } from '$env/static/public';
  import Editor from '@tinymce/tinymce-svelte';
  import { appStore } from '$lib/utils/store/app';

  export let id = '';
  export let value: string;
  export let onChange = (html: string) => {};
  export let height = 300;
  export let placeholder = '';
  export let editorWindowRef: Window | undefined = undefined;
  export let maxHeight: number | undefined = undefined;

  const apiKey = PUBLIC_TINYMCE_API_KEY;

  let tinmycEditor: any;
  let unmount = false

  // editor configuration
  let conf = {
    plugins: 'lists',
    toolbar: [
      { name: 'history', items: ['undo', 'redo'] },
      { name: 'styles', items: ['styles'] },
      { name: 'formatting', items: ['bold', 'italic'] },
      { name: 'alignment', items: ['alignleft', 'aligncenter', 'alignright', 'alignjustify'] },
      { name: 'indentation', items: ['outdent', 'indent'] },
      { name: 'list', items: ['numlist', 'bullist'] }
    ],
    lists_indent_on_tab: false,
    min_height: height,
    max_height: maxHeight,
    placeholder: placeholder,
    skin: 'oxide-dark',
    content_css: 'dark',
    init_instance_callback: function (editor: any) {
      editorWindowRef = editor.iframeElement?.contentWindow;

      tinmycEditor = editor;
      editor.on('Change', function () {
        const html = editor.getContent();
        if (onChange) {
          onChange(html);
        }

        // backup in case the data doesn't get to our backend, we should store the note to avoid data loss
        if (id) {
          localStorage.setItem(id, html);
        }
      });
    }
  };

  function handleModeChange(isDark: boolean) {
    if (!tinmycEditor) return;

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

  $: handleModeChange($appStore.isDark);
</script>

<div>
  {#if !unmount}
  <Editor bind:value {apiKey} {conf} />
  {/if}
</div>
