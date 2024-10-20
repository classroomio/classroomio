<script lang="ts">
  interface Props {
    src: string;
    alt: string;
  }

  let { src, alt }: Props = $props();
</script>

<figure>
  <img
    {src}
    {alt}
    loading="lazy"
    class="max-w-full w-full h-full md:min-h-[400px] object-cover my-2 rounded-lg"
  />
</figure>
