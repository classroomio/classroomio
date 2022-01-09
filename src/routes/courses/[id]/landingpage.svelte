<script context="module">
  export async function preload({ params }) {
    return { courseId: params.id };
  }
</script>

<script>
  import { fly } from 'svelte/transition';
  import CourseLandingPage from '../../../components/CourseLandingPage/index.svelte';
  import Editor from '../../../components/CourseLandingPage/components/Editor/index.svelte';
  import { isMobile } from '../../../utils/store/useMobile';

  export let courseId;
</script>

<div
  class="root absolute inset-0 flex justify-center items-center z-50 bg-white"
  in:fly={{ y: 500, duration: 500 }}
  out:fly={{ y: 500, duration: 500 }}
>
  <Editor {courseId} />
  <div class="rightBar" class:isMobile={$isMobile}>
    <CourseLandingPage />
  </div>
</div>

<style>
  .rightBar {
    flex-grow: 1;
    width: calc(100% - 360px);
    overflow: auto;
    height: 100%;
    overflow: auto;
  }

  .rightBar.isMobile {
    margin-left: 10px;
  }
</style>
