<script lang="ts">
  import { Editor, PathwayLandingPage } from '$lib/components/Pathways/components/LandingPage';
  import { pathway, pathwayCourses } from '$lib/components/Pathways/store';
  import type { Pathway, PathwayCourse } from '$lib/utils/types';
  import { fly } from 'svelte/transition';

  export let data;

  const { pathwayId } = data;

  let pathwayData: Pathway = $pathway;

  function setPathwayData(pathway: Pathway, pathway_course: PathwayCourse[]) {
    pathwayData = { ...pathway, pathway_course };
  }

  function syncPathwayStore(_pathwayData: Pathway) {
    $pathway = _pathwayData;
  }

  $: setPathwayData($pathway, $pathwayCourses);
</script>

<div
  class="absolute inset-0 z-50 flex bg-white"
  in:fly={{ y: 500, duration: 500 }}
  out:fly={{ y: 500, duration: 500 }}
>
  <Editor {pathwayId} bind:pathway={pathwayData} {syncPathwayStore} />
  <div class="rightBar">
    <PathwayLandingPage bind:pathwayData editMode={true} />
  </div>
</div>

<style>
  .rightBar {
    flex-grow: 1;
    width: 100%;
    height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
  }
</style>
