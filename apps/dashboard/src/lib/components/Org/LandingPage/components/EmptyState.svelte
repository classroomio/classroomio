<script>
  import LandingPageEmptyIcon from '$lib/components/Icons/LandingPageEmptyIcon.svelte';

  export let type = 'course';
  export let className = '';
  export let headerClassName = '';
  export let subtitleClassName = '';
</script>

<section
  class="{className} w-full h-[300px] border rounded-md py-4 flex items-center justify-center"
>
  <div class="flex items-center gap-6">
    <LandingPageEmptyIcon />
    <div>
      {#if type == 'course'}
        <h3 class={headerClassName}>"No Course yet"</h3>
        <p class={subtitleClassName}>
          Looks like courses have not been added yet.<br /> Kindly check back latter
        </p>
      {:else}
        <h3 class={headerClassName}>"No Pathways yet"</h3>
        <p class={subtitleClassName}>
          Looks like pathways have not been added yet.<br /> Kindly check back latter
        </p>
      {/if}
    </div>
  </div>
</section>
