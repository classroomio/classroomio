<script>
  import Camera from 'carbon-icons-svelte/lib/Camera20';

  export let avatar = null;
  export let src = null;

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

<section class="width-fit flex flex-col items-center">
  <p
    class="width-fit text-blue-700 flex items-center cursor-pointer text-sm"
    on:click={() => {
      fileinput.click();
    }}
  >
    <Camera /> <span class="ml-2">Upload Image</span>
  </p>

  <input
    style="display:none"
    type="file"
    accept=".jpg, .jpeg, .png"
    on:change={(e) => onFileSelected(e)}
    bind:this={fileinput}
  />
</section>

<style>
  .width-fit {
    width: fit-content;
  }
</style>
