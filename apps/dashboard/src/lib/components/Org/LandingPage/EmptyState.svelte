<script>
  import EmptyOrgSectionIcon from './../../Icons/EmptyOrgSectionIcon.svelte';

  export let title = '';
  export let subtitle = '';
</script>

<div
  class="mx-auto flex w-full max-w-4xl items-center justify-center gap-10 rounded-md border bg-gray-50 py-14"
>
  <EmptyOrgSectionIcon />

  <div>
    <h3 class="my-5 text-2xl dark:text-white">
      "{title}"
    </h3>
    <p class="dark:text-white">
      {subtitle}
    </p>
  </div>
</div>
