<script lang="ts">
  interface Props {
    src: string;
    alt: string;
  }

  let { src, alt }: Props = $props();
</script>

<figure>
  <img {src} {alt} loading="lazy" class="my-2 h-full w-full max-w-full rounded-lg object-cover md:min-h-[400px]" />
</figure>
