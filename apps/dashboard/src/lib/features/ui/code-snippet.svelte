<script lang="ts">
  import { SafeHtmlContent } from '@cio/ui/custom/safe-html-content';

  interface Props {
    code?: string;
  }

  let { code = '' }: Props = $props();
</script>

<div class="mb-3 rounded-md bg-gray-200 p-5 dark:bg-gray-500">
  <SafeHtmlContent content={code} />
</div>
