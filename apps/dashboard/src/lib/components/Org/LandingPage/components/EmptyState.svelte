<script>
  import LandingPageEmptyIcon from '$lib/components/Icons/LandingPageEmptyIcon.svelte';

  export let type = 'course';
  export let template = 'generic';
  export let className = '';
  export let headerClassName = '';
  export let subtitleClassName = '';
</script>

<section
  class="{className} w-full h-[300px] border rounded-md py-4 flex items-center justify-center p-2 my-2"
>
  <div class="flex items-center gap-6">
    <LandingPageEmptyIcon {template} />
    <div>
      {#if type == 'course'}
        <h3 class={headerClassName}>"No Course yet"</h3>
        <p class="text-sm md:text-base {subtitleClassName}">
          Looks like courses have not been added yet.<br /> Kindly check back later
        </p>
      {:else}
        <h3 class={headerClassName}>"No Pathways yet"</h3>
        <p class="text-sm md:text-base {subtitleClassName}">
          Looks like pathways have not been added yet.<br /> Kindly check back later
        </p>
      {/if}
    </div>
  </div>
</section>
