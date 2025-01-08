<script lang="ts">
  import { dev } from '$app/environment';
  import { fly } from 'svelte/transition';

  import type { Pathway, PathwayCourse } from '$lib/utils/types';
  import { pathway, pathwayCourses } from '$lib/components/Pathways/store';

  import Editor from '$lib/components/Pathways/components/PathwayLandingPage/components/Editor/index.svelte';
  import PathwayLandingpage from '$lib/components/Pathways/components/PathwayLandingPage/index.svelte';

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
  $: dev && console.log('pathwayData changed', pathwayData);
</script>

<div
  class="absolute flex inset-0 z-50 bg-white"
  in:fly={{ y: 500, duration: 500 }}
  out:fly={{ y: 500, duration: 500 }}
>
  <Editor {pathwayId} bind:pathway={pathwayData} {syncPathwayStore} />
  <div class="rightBar">
    <PathwayLandingpage bind:pathwayData editMode={true} />
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
