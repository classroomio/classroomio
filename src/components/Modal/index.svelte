<script>
  import CloseButton from '../Buttons/Close/index.svelte';

  export let open;
  export let onClose;
  export let modalHeading;
</script>

{#if open}
  <div
    class="dialog fixed overflow-x-hidden overflow-y-auto inset-0 flex justify-center items-center z-50 bg-gray-100 bg-opacity-50"
  >
    <div aria-hidden="true" class="backdrop" />
    <div class="bg-white mx-auto w-3xl shadow-lg p-5 pt-2 rounded-md">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-xl m-0">
          {modalHeading}
        </h3>
        <CloseButton onClick={onClose} contained={true} />
      </div>

      <slot />
    </div>
  </div>
{/if}

<style>
  .dialog {
    background-color: rgba(0, 0, 0, 0.5);
  }
</style>
