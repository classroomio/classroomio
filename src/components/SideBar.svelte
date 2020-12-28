<script>
  // your script goes here
  const contributors = [
    {
      name: 'Koskting'
    },
    {
      name: 'Koskting'
    },
    {
      name: 'Koskting'
    },
    {
      name: 'Koskting'
    },
    {
      name: 'Koskting'
    },
  ];
</script>

<style>
  .sidebar-root {
    width: 250px;
    min-width: 250px;
    height: fit-content;
  }

</style>

<!-- markup (zero or more items) goes here -->
<div class="sidebar-root p-5 w-100 border border-1 border-gray rounded-md md:mt-12">
  <h4 class="border-b border-gray text-base font-bold pb-1">Самые полезные</h4>
  {#each contributors as contributor}
    <a class="flex pt-3" href="/{contributor.name}">
      <img
        class="inline-block overflow-hidden rounded-full mr-1 leading-none align-middle"
        src="https://avatars0.githubusercontent.com/u/2854919?s=40&amp;v=4"
        width="23"
        height="20"
        alt="@jamesmosier"
      >
      <span class="hover:text-blue-700 hover:underline">{contributor.name}</span>
    </a>
	{/each}
</div>
