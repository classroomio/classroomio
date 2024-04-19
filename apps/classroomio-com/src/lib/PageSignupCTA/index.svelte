<script>
  export let header = '';
  export let subText = '';
  export let btnLabel = '';
  export let link = '';
  export let demo = true;
</script>

<div
  class="floating grad relative mx-auto mt-[10%] flex h-[61vh] w-[100%] flex-col items-center justify-center px-[6%] py-[12%] text-center shadow-2xl lg:h-[54vh] lg:w-[70%] lg:rounded-3xl"
>
  <div>
    <h1 class="font-display mt-3 text-3xl font-bold tracking-tight text-white lg:mt-2 lg:text-4xl">
      {header}
    </h1>
    <p class="mt-6 text-xl text-gray-300 lg:text-lg">
      {subText}
    </p>
  </div>

  {#if demo}
    <button
      class="text-md mt-10 rounded-md bg-white px-6 py-4 font-semibold text-gray-900 lg:px-7 lg:py-3 lg:text-lg"
      data-cal-config="'layout':'month_view'"
      data-cal-link="classroomio/demo"
    >
      {btnLabel}
    </button>
  {:else}
    <a
      class="text-md mt-10 rounded-md bg-white px-6 py-4 font-semibold text-gray-900 lg:px-7 lg:py-3 lg:text-lg"
      href={link}
      target="_blank"
      rel="noopener noreferrer nofollow"
    >
      {btnLabel}
    </a>
  {/if}
</div>

<style>
  .grad {
    background: rgb(51, 16, 71);
    background: radial-gradient(circle at 50% 100%, rgba(51, 16, 71, 1) 1%, rgba(2, 0, 36, 1) 100%);
    background-size: cover;
  }
</style>
