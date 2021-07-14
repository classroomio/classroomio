<script>
  import { Tabs, Tab, TabContent } from 'carbon-components-svelte';
  import MarkdownRender from '../../../../MarkdownRender/index.svelte';
  import { lesson } from '../store/lessons';
</script>

<Tabs class="flex justify-center" type="container">
  <Tab label="Note" />
  <Tab label="Slide" />
  <Tab label="Video" />

  <div slot="content">
    <TabContent>
      <MarkdownRender content={$lesson.materials.note} />
    </TabContent>
    <TabContent>
      <iframe
        title="Embeded Slides"
        src={$lesson.materials.slide}
        frameborder="0"
        width="100%"
        height="569"
        allowfullscreen="true"
        mozallowfullscreen="true"
        webkitallowfullscreen="true"
      />
    </TabContent>
    <TabContent>
      <iframe
        width="100%"
        height="569"
        src={$lesson.materials.video}
        title="YouTube video player"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      />
    </TabContent>
  </div>
</Tabs>

<!-- <div class="flex mb-2">
  <button
    on:click={handleTabClick(0)}
    class="focus:outline-none text-lg font-bold border-b-2 border-transparent {currentTab ===
      0 && `${activeClassName}`}"
  >
    Note
  </button>
  <button
    on:click={handleTabClick(1)}
    class="focus:outline-none text-lg font-bold border-b-2 border-transparent {currentTab ===
      1 && `${activeClassName}`}"
  >
    
  </button>
  <button
    on:click={handleTabClick(2)}
    class="focus:outline-none text-lg font-bold border-b-2 border-transparent {currentTab ===
      2 && `${activeClassName}`}"
  >
    Video
  </button>
</div>

<div class="m-2 mb-0 p-0">
  {#if currentTab === 0}
    <MarkdownRender content={$lesson.materials.note} />
  {:else if currentTab === 1}
    <iframe
      title="Embeded Slides"
      src={$lesson.materials.slide}
      frameborder="0"
      width="100%"
      height="569"
      allowfullscreen="true"
      mozallowfullscreen="true"
      webkitallowfullscreen="true"
    />
  {:else if currentTab === 2}
    <iframe
      width="100%"
      height="569"
      src={$lesson.materials.video}
      title="YouTube video player"
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
    />
  {/if}
</div> -->
<style>
  button {
    padding: 12px 12px 8px 12px;
  }
</style>
