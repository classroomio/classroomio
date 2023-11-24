<script>
  import Editor from 'cl-editor/src/Editor.svelte';

  export let html = '';
  export let editor;

  let colors = [
    '#000000',
    '#e60000',
    '#ff9900',
    '#ffff00',
    '#008a00',
    '#0066cc',
    '#9933ff',
    '#ffffff',
    '#facccc',
    '#ffebcc',
    '#ffffcc',
    '#cce8cc',
    '#cce0f5',
    '#ebd6ff',
    '#bbbbbb',
    '#f06666',
    '#ffc266',
    '#ffff66',
    '#66b966',
    '#66a3e0',
    '#c285ff',
    '#888888',
    '#a10000',
    '#b26b00',
    '#b2b200',
    '#006100',
    '#0047b2',
    '#6b24b2',
    '#444444',
    '#5c0000',
    '#663d00',
    '#666600',
    '#003700',
    '#002966',
    '#3d1466'
  ];
</script>

<Editor bind:this={editor} {html} {colors} on:change={(evt) => (html = evt.detail)} />
