<script>
  import { PageHeader } from '$lib/components';

  /**
   * @typedef {Object} Props
   * @property {import('svelte').Snippet} [children]
   */

  /** @type {Props} */
  let { children } = $props();
</script>

<PageHeader className="flex flex-col items-center justify-center bg-[#F5F8FE] text-center pb-8">
  <div class="mb-2 flex w-full items-center justify-center">
    <span
      class="rounded-full border-2 border-[#C2D2FF] bg-[#DCE5FF] px-4 py-1 text-sm font-medium text-blue-700"
      style="color: rgb(75, 85, 99);"
    >
      Legal
    </span>
  </div>
  <h1 class="text-4xl font-semibold text-slate-900 md:text-5xl">Privacy Policy</h1>
</PageHeader>

<section class="mx-auto w-[90%] max-w-3xl px-4 py-12 lg:w-[60%]">
  <article class="prose prose-slate prose-headings:scroll-mt-24 prose-a:text-blue-700 max-w-none">
    {@render children?.()}
  </article>
</section>
