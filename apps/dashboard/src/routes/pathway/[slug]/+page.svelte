<script lang="ts">
  import { PathwayLandingPage } from '$lib/components/Pathway/components/LandingPage';
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

<PathwayLandingPage {pathwayData} />
