<script lang="ts">
  import { lesson } from '../../store/lessons';

  let url = $derived(getUrl($lesson.materials.slide_url));

  function canvaHandler(_url): string {
    if (_url.includes('?embed')) return _url;

    return `${_url}?embed`;
  }

  function getUrl(_url: string | null): string | undefined {
    if (!_url) return;

    console.log({ _url });
    if (_url.includes('www.canva.com')) {
      return canvaHandler(_url);
    }

    return _url;
  }
</script>

{#if url}
  <iframe
    title="Embeded Slides"
    src={url}
    frameborder="0"
    width="100%"
    height="569"
    class="iframe my-3"
    allowfullscreen={true}
  ></iframe>
{/if}
