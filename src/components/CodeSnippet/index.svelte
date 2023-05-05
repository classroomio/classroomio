<script>
  import marked from 'marked';

  export let code = '';
</script>

<div class="bg-gray-200 dark:bg-gray-500 p-5 rounded-md mb-3">
  {@html marked('```js\n' + code + '\n```')}
</div>
