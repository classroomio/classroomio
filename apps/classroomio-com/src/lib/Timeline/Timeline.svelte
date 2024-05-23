<script>
  export let items = [];
</script>

<div class="relative w-fit flex justify-center space-x-5 md:space-x-10">
  <div class="w-[3px] md:w-[2px] bg-blue-600 mt-10" />
  <div class="space-y-8">
    {#each items as card, index}
      <div class="md:w-[40rem] w-full border rounded-md px-4 py-8 space-y-4">
        <div class="flex items-center">
          <div
            class={`z-50 absolute -left-3 ${
              index > 0 &&
              'before:bg-gradient-to-t before:from-white before:to-transparent before:w-[4px] before:h-[9rem] before:absolute before:-top-36'
            } flex items-center justify-center w-7 h-7 bg-blue-100 rounded-full`}
          >
            <div class="w-4 h-4 bg-blue-800 rounded-full z-50" />
          </div>
          <h1 class="text-2xl font-bold text-blue-800">{card.title}</h1>
        </div>
        <p class="text-sm text-gray-500">
          {card.desc}
        </p>
      </div>
    {/each}
  </div>
</div>
