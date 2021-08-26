<script>
  export let avatar;
  export let src;
  export let widthHeight;

  let fileinput;

  const onFileSelected = (e) => {
    const image = e.target.files[0];
    let reader = new FileReader();
    reader.readAsDataURL(image);
    reader.onload = (e) => {
      avatar = image;
      src = e.target.result;
    };
  };
</script>

<section class="flex justify-center">
  <div
    class="avatar-container {widthHeight ||
      'setwidthheight'} pointer border-2 border-gray-200 relative hover:bg-gray-400 hover:bg-opacity-75 cursor-pointer rounded-full"
    on:click={() => {
      fileinput.click();
    }}
  >
    {#if src}
      <img class="w-full h-full rounded-full" {src} alt="d" />
    {:else if avatar}
      <img class="w-full h-full rounded-full" src={avatar} alt="d" />
    {:else}
      <img
        class="w-full h-full rounded-full"
        src="https://cdn4.iconfinder.com/data/icons/small-n-flat/24/user-alt-512.png"
        alt=""
      />
    {/if}
    <div
      class="upload-icon w-full h-full flex items-center justify-center top-0"
    >
      <svg
        class="text-white"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        role="presentation"
        ><g fill="currentColor" fill-rule="evenodd"
          ><path
            d="M2 6.994C2 5.893 2.898 5 3.99 5h16.02C21.108 5 22 5.895 22 6.994v12.012A1.997 1.997 0 0120.01 21H3.99A1.994 1.994 0 012 19.006V6.994zM12 17a4 4 0 100-8 4 4 0 000 8zm5-8c0 .556.448 1 1 1 .556 0 1-.448 1-1 0-.556-.448-1-1-1-.556 0-1 .448-1 1zM8 4c0-.552.453-1 .997-1h6.006c.55 0 .997.444.997 1v1H8V4z"
          /><circle cx="12" cy="13" r="2" /></g
        ></svg
      >
    </div>
  </div>

  <input
    style="display:none"
    type="file"
    accept=".jpg, .jpeg, .png"
    on:change={(e) => onFileSelected(e)}
    bind:this={fileinput}
  />
</section>

<style>
  .avatar-container.setwidthheight {
    height: 128px;
    width: 128px;
  }

  .upload-icon {
    display: none;
  }

  .avatar-container:hover .upload-icon {
    display: flex;
    position: absolute;
  }
</style>
