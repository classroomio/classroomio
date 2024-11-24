<script lang="ts">
  export let src: string;
  export let alt: string;
</script>

<figure>
  <img
    {src}
    {alt}
    loading="lazy"
    class="max-w-full w-full h-full md:min-h-[400px] object-cover my-2 rounded-lg"
  />
</figure>
