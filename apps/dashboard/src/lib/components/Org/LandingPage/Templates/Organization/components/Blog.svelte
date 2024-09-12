<script>
  import BlogCard from './BlogCard.svelte';
</script>

<section id="course" class="px-4 pt-4 pb-20 h-full bg-white">
  <h1 class="text-center text-3xl text-[#3F3F3F]">Latest blog Post</h1>
  <section class="flex flex-wrap items-center justify-center md:justify-start gap-4 p-4">
    <BlogCard />
    <BlogCard />
    <BlogCard />
  </section>
</section>
