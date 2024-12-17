<script lang="ts">
  interface Props {
    bannerImage: string | undefined;
    slug?: string;
    title?: string;
    description?: string;
    cost?: number;
    totalLessons?: number;
    currency?: string;
    type: any;
  }

  let {
    bannerImage,
    slug = '',
    title = '',
    description = '',
    cost = 0,
    totalLessons = 0,
    currency = 'USD'
  }: Props = $props();

  function getCourseUrl() {
    return `/course/${slug}`;
  }
</script>

<a
  rel="prefetch"
  href={getCourseUrl()}
  class="border-gray relative h-fit w-full min-w-[250px] max-w-[300px] rounded border text-black transition-all ease-in-out hover:scale-95 dark:border-neutral-600 md:h-[350px]"
>
  <div class="p-4">
    <div class="relative mb-5">
      <img
        src={bannerImage || '/course-banner.jpg'}
        alt="Course Logo"
        class="relative h-[170px] w-full rounded dark:border dark:border-neutral-600"
      />
    </div>

    <h3 class="line-clamp-1 text-xl font-semibold dark:text-white">{title}</h3>
    <p class="description mt-2 text-sm text-gray-500 dark:text-gray-300">
      {description}
    </p>
  </div>

  <div class="border-gray mx-2 flex justify-between border-t py-4 dark:border-neutral-600">
    <div>
      <p class="pl-2 text-xs dark:text-white">
        {totalLessons}
        lessons
      </p>
    </div>
    <p class="text-xs">
      <span class="px-2 font-bold text-[#944499]"
        >{!cost ? 'Free' : currency == 'USD' ? `$ ${cost}` : `N ${cost}`}</span
      >
    </p>
  </div>
</a>

<style>
  a,
  a:hover {
    text-decoration: none;
  }

  .description {
    height: 42px;
    line-height: 20px;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -moz-box-orient: vertical;
    -ms-box-orient: vertical;
    box-orient: vertical;
    -webkit-line-clamp: 2;
    -moz-line-clamp: 2;
    -ms-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
  }
</style>
