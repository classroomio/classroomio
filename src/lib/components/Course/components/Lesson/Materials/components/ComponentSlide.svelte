<script>
  import { lesson } from '../../store/lessons';
</script>

{#if $lesson.materials.slide_url}
  <iframe
    title="Embeded Slides"
    src={$lesson.materials.slide_url}
    frameborder="0"
    width="100%"
    height="569"
    class="iframe my-3"
    allowfullscreen="true"
    mozallowfullscreen="true"
    webkitallowfullscreen="true"
  />
{/if}
