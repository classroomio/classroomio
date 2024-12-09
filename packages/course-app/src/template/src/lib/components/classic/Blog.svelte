<script lang="ts">
  import BlogCard from './BlogCard.svelte';
</script>

<section id="course" class="px-4 py-6 pb-20 h-full bg-white">
  <h1 class="text-center text-3xl text-[#3F3F3F] font-bold mb-4">Latest blog Post</h1>
  <section class="grid place-items-center grid-cols-1 md:grid-cols-2 xl:grid-cols-4 w-full">
    <BlogCard />
    <BlogCard />
    <BlogCard />
    <BlogCard />
  </section>
</section>
