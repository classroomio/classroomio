<script context="module">
	export async function preload({ params }) {
		// the `id` parameter is available because
		// this file is called [id].svelte
    const res = await this.fetch(`discussion/${params.id}.json`);
		const data = await res.json();

		if (res.status === 200) {
			return { discussion: data };
		} else {
			this.error(res.status, data.message);
		}
	}
</script>

<script>
	export let discussion;
</script>

<style>

</style>

<svelte:head>
	<title>{discussion.title}</title>
</svelte:head>

<h1>{discussion.title}</h1>

<div class="my-1 px-1 w-full md:w-1/2 lg:my-4 lg:px-4 lg:w-1/3">
  <!-- Article -->
  <article class="overflow-hidden rounded-lg shadow-lg">

      <a href="#">
          <img alt="Placeholder" class="block h-auto w-full" src="https://picsum.photos/600/400/?random">
      </a>

      <header class="flex items-center justify-between leading-tight p-2 md:p-4">
          <h1 class="text-lg">
              <a class="no-underline hover:underline text-black" href="#">
                  Article Title
              </a>
          </h1>
        <p class="text-grey-darker text-sm">
            14/4/19
          </p>
        </header>

        <footer class="flex items-center justify-between leading-none p-2 md:p-4">
            <a class="flex items-center no-underline hover:underline text-black" href="#">
                <img alt="Placeholder" class="block rounded-full" src="https://picsum.photos/32/32/?random">
                <p class="ml-2 text-sm">
                    Author Name
                </p>
            </a>
            <a class="no-underline text-grey-darker hover:text-red-dark" href="#">
                <span class="hidden">Like</span>
                <i class="fa fa-heart"></i>
            </a>
        </footer>

    </article>
    <!-- END Article -->

</div>
<!-- END Column -->
