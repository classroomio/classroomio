<script context="module">
  export async function preload({ params }) {
    return { slug: params.slug };
  }
</script>

<script>
  import CourseLandingPage from '../../components/CourseLandingPage/index.svelte';
  import Editor from '../../components/CourseLandingPage/components/Editor/index.svelte';
  import { isMobile } from '../../utils/store/useMobile';
</script>

<div class="root">
  <Editor />
  <div class="rightBar" class:isMobile={$isMobile}>
    <CourseLandingPage />
  </div>
</div>

<style>
  .root {
    display: flex;
    width: 100%;
  }

  .rightBar {
    flex-grow: 1;
    width: calc(100% - 360px);
  }

  .rightBar.isMobile {
    margin-left: 10px;
  }
</style>
