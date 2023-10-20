<script lang="ts">
  import TextField from '$lib/components/Form/TextField.svelte';
  export let gradeMax = 0;
  export let disableGrading = false;
  export let grade: number | undefined = 0;
</script>

{#if typeof grade === 'number'}
  <div class="flex items-center">
    <TextField
      placeholder="Points"
      bind:value={grade}
      type="number"
      className="w-12"
      isDisabled={disableGrading}
    />
    <p class="dark:text-white ml-2 text-lg flex items-center">
      <span class="mr-1">/</span> <span>{gradeMax}</span>
    </p>
  </div>
{/if}
