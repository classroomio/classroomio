<script>
  export let logo = '';
  export let id = '';
  export let title = '';
  export let description = '';
</script>

<a
  rel="prefetch"
  class="root w-72 border bg-gray-100 px-2 py-7 mr-4 mb-4 rounded-md hover:shadow-2xl transition ease-in-out"
  href="/courses/{id}"
>
  <img
    class="w-24 h-24 rounded-full border mx-auto"
    src={logo}
    alt="Course Logo"
  />
  <div class="pt-3 text-center space-y-4">
    <h3 class="text-lg font-semibold">
      {title}
    </h3>
    <div
      class="description text-left font-small flex flex-col text-gray-500"
      title={description}
    >
      {description}
    </div>
  </div>
</a>

<style>
  .root {
    min-height: 300px;
    text-decoration: none;
  }

  .description {
    line-height: 20px;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -moz-box-orient: vertical;
    -ms-box-orient: vertical;
    box-orient: vertical;
    -webkit-line-clamp: 5;
    -moz-line-clamp: 5;
    -ms-line-clamp: 5;
    line-clamp: 5;
    overflow: hidden;
  }
</style>
