<script lang="ts">
  import PathwayLandingpage from '$lib/components/Pathways/components/PathwayLandingPage/index.svelte';
  import type { Pathway } from '$lib/utils/types';

  interface Data {
    pathway: Pathway;
  }

  export let data: Data;

  let pathwayData: Pathway;

  function setPathwayData(pathway: Pathway | null) {
    if (!pathway) return;

    pathwayData = { ...pathway };
  }

  $: setPathwayData(data.pathway);
</script>

<PathwayLandingpage {pathwayData} />
