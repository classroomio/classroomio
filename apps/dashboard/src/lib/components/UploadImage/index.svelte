<script lang="ts">
  import Camera from 'carbon-icons-svelte/lib/Camera.svelte';

  export let avatar: string | undefined;
  export let src: string | undefined;
  export let widthHeight = '';
  export let shape = 'rounded-full';
  export let errorMessage: string | null = null;

  let fileinput: HTMLInputElement;

  const onFileSelected = (e: Event<HTMLInputElement>) => {
    const image = e.target.files[0];
    let reader = new FileReader();
    reader.readAsDataURL(image);
    reader.onload = (e) => {
      avatar = image;
      // @ts-ignore
      src = e.target?.result || undefined;
    };
  };
</script>

<section class="width-fit p-3 flex flex-col items-center">
  <div
    class="avatar-container {widthHeight ||
      'setwidthheight'} pointer border-2 border-gray-200 relative {shape}"
  >
    {#if src}
      <img class="w-full h-full {shape}" {src} alt="Avatar" />
    {:else if avatar}
      <img class="w-full h-full {shape}" src={avatar} alt="Avatar" />
    {:else}
      <img
        class="w-full h-full {shape}"
        src="https://cdn4.iconfinder.com/data/icons/small-n-flat/24/user-alt-512.png"
        alt=""
      />
    {/if}
  </div>

  <button
    class="width-fit text-primary-700 flex items-center cursor-pointer text-sm mt-3"
    on:click={() => {
      fileinput.click();
    }}
  >
    <Camera size={20} /> <span class="ml-2">Upload Image</span>
  </button>
  {#if errorMessage}
    <p class="text-sm text-red-500">{errorMessage}</p>
  {/if}

  <input
    style="display:none"
    type="file"
    accept=".jpg, .jpeg, .png, .webp"
    on:change={(e) => onFileSelected(e)}
    bind:this={fileinput}
  />
</section>

<style>
  .width-fit {
    width: fit-content;
  }

  .avatar-container.setwidthheight {
    height: 128px;
    width: 128px;
  }

  .upload-icon {
    display: none;
  }
</style>
