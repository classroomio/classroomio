<!-- <script>
  import PathwayContainer from '$lib/components/Pathways/components/PathwayContainer.svelte';
</script>

<PathwayContainer>
  <div class="flex justify-center items-center h-full">
    <p>Landing page o!</p>
  </div>
</PathwayContainer> -->

<script lang="ts">
  import { dev } from '$app/environment';
  import { fly } from 'svelte/transition';
  // import Editor from '$lib/components/CourseLandingPage/components/Editor/index.svelte';
  import PathwayLandingpage from '$lib/components/PathwayLandingpage/index.svelte';
  import { course } from '$lib/components/Course/store';
  import { lessons } from '$lib/components/Course/components/Lesson/store/lessons';
  import { pathway } from '$lib/components/Pathways/store';
  import type { Course, Lesson, Pathway, PathwayCourse } from '$lib/utils/types';

  export let data;

  const { pathwayId } = data;

  let pathwayData: Pathway = $pathway;

  function setPathwayData(pathway: Pathway, courses: PathwayCourse[]) {
    pathwayData = { ...pathway, courses };
  }

  // function syncPathwayStore(_pathwayData: PathwayCourse) {
  //   $pathway = _pathwayData;
  // }

  $: setPathwayData($pathway, $course);
  $: dev && console.log('courseData changed', pathwayData);
</script>

<div
  class="absolute flex inset-0 z-50 bg-white"
  in:fly={{ y: 500, duration: 500 }}
  out:fly={{ y: 500, duration: 500 }}
>
  <!-- <Editor {pathwayId} bind:course={courseData} {syncCourseStore} /> -->
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
