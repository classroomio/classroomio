<script lang="ts">
  import { PUBLIC_TINYMCE_API_KEY } from '$env/static/public';
  import Editor from '@tinymce/tinymce-svelte';

  export let value: string;
  export let onChange = (html = '') => {};
  export let height = 300;
  export let placeholder = '';
  export let editorWindowRef;

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
    placeholder: placeholder,
    init_instance_callback: function (editor: any) {
      editorWindowRef = editor.iframeElement?.contentWindow;
      editor.on('Input', function () {
        const html = editor.getContent();
        if (onChange) {
          onChange(html);
        }
      });
    }
  };

  $: value = !value ? '' : value;
</script>

<div>
  <Editor {value} {apiKey} {conf} />
</div>
