<script lang="ts">
  import TextEditor from '$lib/components/TextEditor/index.svelte';

  export let value: string | undefined;
</script>

<div class="h-2/5">
  <TextEditor bind:value />
</div>
