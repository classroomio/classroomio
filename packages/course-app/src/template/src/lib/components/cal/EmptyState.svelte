<script lang="ts">
  interface Props {
    type?: string;
    className?: string;
    headerClassName?: string;
    subtitleClassName?: string;
  }

  let {
    type = 'course',
    className = '',
    headerClassName = '',
    subtitleClassName = ''
  }: Props = $props();
</script>

<section
  class="{className} w-full border rounded-md py-4 flex items-center justify-center p-2 my-2"
>
  <div
    class="flex flex-col md:flex-row justify-center items-center text-center md:text-start gap-6 p-2"
  >
    <img src="/expert-empty.svg" alt="empty" />
    <div>
      {#if type == 'course'}
        <h3 class="font-semibold {headerClassName}">"No Course yet"</h3>
        <p class="text-sm md:text-base {subtitleClassName}">
          Looks like courses have not been added yet.<br /> Kindly check back later
        </p>
      {:else}
        <h3 class="font-semibold {headerClassName}">"No Pathways yet"</h3>
        <p class="text-sm md:text-base {subtitleClassName}">
          Looks like pathways have not been added yet.<br /> Kindly check back later
        </p>
      {/if}
    </div>
  </div>
</section>
