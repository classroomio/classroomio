<script lang="ts">
  interface Props {
    code?: string;
  }

  let { code = '' }: Props = $props();
</script>

<div class="mb-3 rounded-md bg-gray-200 p-5 dark:bg-gray-500">
  {@html code}
</div>
