<script>
  import { sanitizeHtml } from '$lib/utils/functions/sanitize';
  export let code = '';
</script>

<div class="mb-3 rounded-md bg-gray-200 p-5 dark:bg-gray-500">
  {@html sanitizeHtml(code)}
</div>
