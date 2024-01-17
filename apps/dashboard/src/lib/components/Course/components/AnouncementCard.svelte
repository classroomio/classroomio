<script>
    import OverflowMenuVertical from 'carbon-icons-svelte/lib/OverflowMenuVertical.svelte';
    import Send from 'carbon-icons-svelte/lib/Send.svelte';
    import Chip from '$lib/components/Chip/index.svelte';
  
    export let value = {};
  </script>
  
  <div class="flex flex-col gap-5 border-2 border-gray-200 rounded-md my-5">
    <section>
      <div class="p-3">
        <div class="flex justify-between mb-2">
          <span class="flex items-center gap-3">
            <div class="w-9 h-9">
              <img
                src={value.image}
                alt="users banner"
                class="w-full h-full rounded-full object-cover"
              />
            </div>
            <span>
              <p class="text-base font-semibold">{value.name}</p>
              <p class="text-sm font-medium text-gray-600">08:41</p>
            </span>
          </span>
          <OverflowMenuVertical size={24} />
        </div>
        <p class="text-sm font-medium w-[80%] mb-4">{value.content}</p>
      </div>
  
      <div class="flex gap-4 px-3">
        {#each value.emoji as emoji (emoji)}
          <button
            on:click={() => (emoji.count += 1)}
            class={`flex transition ${
              emoji.count >= 1 && 'bg-sky-50 px-1 border border-sky-600 rounded-full'
            }`}
          >
            <div class="text-[15px]">
              {emoji.icon}
            </div>
            {#if emoji.count >= 1}
              <Chip value={emoji.count} className="bg-transparent" />
            {/if}
          </button>
        {/each}
      </div>
    </section>
    <section class="flex items-center justify-between gap-2 border-t-2 border-gray-200 p-3">
      <div class="w-7 h-7">
        <img src={value.image} alt="users banner" class="w-full h-full rounded-full object-cover" />
      </div>
      <div class="flex-1">
        <input
          type="text"
          name=""
          id=""
          placeholder="Add class comment"
          class="w-full bg-transparent border-2 border-gray-200 rounded-3xl"
        />
      </div>
      <Send size={24} />
    </section>
  </div>
  