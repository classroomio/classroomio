<script lang="ts">
  import { PUBLIC_TINYMCE_API_KEY } from '$env/static/public';
  import Editor from '@tinymce/tinymce-svelte';

  export let id = '';
  export let value: string;
  export let onChange = (html: string) => {};
  export let height = 300;
  export let placeholder = '';
  export let editorWindowRef: Window;
  export let maxHeight: number | undefined = undefined;

  const apiKey = PUBLIC_TINYMCE_API_KEY;

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
    init_instance_callback: function (editor: any) {
      editorWindowRef = editor.iframeElement?.contentWindow;
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

  $: value = !value ? '' : value;
</script>

<div>
  <Editor bind:value {apiKey} {conf} />
</div>
