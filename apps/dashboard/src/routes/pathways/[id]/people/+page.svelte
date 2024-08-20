<script>
  import PathwayContainer from '$lib/components/Pathways/components/PathwayContainer.svelte';

  export let data;
</script>

<PathwayContainer bind:pathwayId={data.pathwayId}>
  <div class="flex justify-center items-center h-full">
    <p>People page o!</p>
  </div>
</PathwayContainer>
