<script lang="ts">
  const sharedClass =
    'rounded-full outline outline-8 dark:outline-gray-950 sm:my-6 md:my-8 size-1 my-4 outline-gray-50 bg-green-400';
</script>

<div class="ui:absolute ui:z-0 ui:grid ui:h-full ui:w-full ui:items-center ui:gap-8 ui:lg:grid-cols-2">
  <section class="ui:absolute ui:z-0 ui:grid ui:h-full ui:w-full ui:place-content-between grid-cols-2">
    <div class={`${sharedClass} ui:-mx-[2.5px]`}></div>
    <div class={`${sharedClass} ui:-mx-[2px] ui:place-self-end`}></div>
    <div class={`${sharedClass} ui:-mx-[2.5px]`}></div>
    <div class={`${sharedClass} ui:-mx-[2px] ui:place-self-end`}></div>
  </section>
</div>
