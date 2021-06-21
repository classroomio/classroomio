<!--
    import marked from "marked";
    {@html marked(readme, { breaks: true, gfm: true })}
-->
<script>
  const activeClassName = "border-blue-700";
  let slideLink = 'https://docs.google.com/presentation/d/e/2PACX-1vS7mulzY5v1X_D0Gz68M2sggq2zjHCuoyY5JI07hcsOA4svDV5rxhLD9V3ckO_Rz7TK1YniQJtu0CXM/embed?start=false&loop=false&delayms=3000';
  let currentTab = 1;

  function handleTabClick(tab) {
    return () => {
      currentTab = tab;
    }
  }
</script>

<div class="flex mb-2">
  <button
    on:click={handleTabClick(1)}
    class="focus:outline-none text-lg font-bold border-b-2 border-transparent {currentTab === 1 && `${activeClassName}`}"
  >
    Slide
  </button>
  <button
    on:click={handleTabClick(2)}
    class="focus:outline-none text-lg font-bold border-b-2 border-transparent {currentTab === 2 && `${activeClassName}`}"
  >
    Video
  </button>
</div>

<div class="m-2 mb-0 p-0">
  {#if currentTab === 1}
    <iframe
      title="Embeded Slides"
      src={slideLink}
      frameborder="0"
      width="100%"
      height="569"
      allowfullscreen="true"
      mozallowfullscreen="true"
      webkitallowfullscreen="true"
    >
    </iframe>
  {:else if currentTab === 2}
    <iframe
      width="100%"
      height="569"
      src="https://www.youtube.com/embed/luM5uobewhA"
      title="YouTube video player"
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen>
    </iframe>
  {/if}
</div>

<style>
  button {
    padding: 12px 12px 8px 12px;
  }
</style>
