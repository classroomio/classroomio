<script>
  import { createEventDispatcher } from 'svelte';

  export let image = null; // 🔹 Parent can access uploaded image
  export let loading = false; // 🔹 Parent can track loading state

  let fileInput;
  let isHovering = false;
  let isDragging = false;
  const dispatch = createEventDispatcher(); // 🔹 Allows sending events to parent

  function handleDragOver(event) {
    event.preventDefault();
    isDragging = true;
  }

  function handleDragLeave() {
    isDragging = false;
  }

  function handleDrop(event) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      loadImage(file);
    }
    isDragging = false;
    isHovering = false;
  }

  function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      loadImage(file);
    }
    // Reset the input value to allow selecting the same file again
    event.target.value = null;
  }

  function triggerFileInput(event) {
    event.stopPropagation();
    fileInput.click();
  }

  async function loadImage(file) {
    loading = true;
    dispatch('loading', { loading: true }); // 🔹 Notify parent about loading state

    const reader = new FileReader();
    reader.onload = async () => {
      image = reader.result;
      loading = false;
      dispatch('change', { image }); // 🔹 Notify parent that image changed
    };
    reader.readAsDataURL(file);
  }

  function clearImage(event) {
    event.stopPropagation();
    image = null;
    dispatch('clear'); // 🔹 Notify parent that image was cleared
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div
  class="relative flex h-64 w-96 cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-gray-400 text-gray-500 transition-all hover:border-gray-600"
  on:dragover|preventDefault={handleDragOver}
  on:dragleave={handleDragLeave}
  on:drop={handleDrop}
  on:mouseenter={() => (isHovering = true)}
  on:mouseleave={() => (isHovering = false)}
  on:click={triggerFileInput}
>
  {#if loading}
    <!-- 🔄 Overlay with Spinner -->
    <div class="absolute inset-0 flex items-center justify-center bg-white/70">
      <div
        class="h-8 w-8 animate-spin rounded-full border-4 border-gray-500 border-t-transparent"
      ></div>
    </div>
  {/if}

  {#if image}
    <!-- svelte-ignore a11y-img-redundant-alt -->
    <img
      src={image}
      alt="Uploaded image"
      class="absolute left-0 top-0 h-full w-full object-cover transition-opacity duration-300 {isHovering ||
      isDragging
        ? 'opacity-20'
        : 'opacity-100'}"
    />
    <button
      class="absolute right-2 top-2 rounded-full bg-white p-1 text-gray-700 shadow-md hover:bg-gray-200"
      on:click={clearImage}
    >
      ✕
    </button>
  {/if}

  <div
    class="flex flex-col items-center justify-center transition-opacity duration-300 {image &&
    !isHovering &&
    !isDragging
      ? 'opacity-0'
      : 'opacity-100'}"
  >
    <p>Drag & Drop your image here</p>
    <p>Or</p>
    <span class="border bg-blue-900/60 p-2 text-white"> click to upload </span>
  </div>

  <input
    type="file"
    accept="image/*"
    class="hidden"
    bind:this={fileInput}
    on:change={handleFileSelect}
  />
</div>
