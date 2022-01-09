<script context="module">
  export async function preload({ params }) {
    return { slug: params.slug };
  }
</script>

<script>
  import CourseLandingPage from '../../components/CourseLandingPage/index.svelte';

  export let slug;
</script>

<CourseLandingPage {slug} />
