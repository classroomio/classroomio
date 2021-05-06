<script>
  import Education16 from "carbon-icons-svelte/lib/Education16";
  import Catalog16 from "carbon-icons-svelte/lib/Catalog16";

  export let lectures = [
    "Today",
    "Yesterday",
    "April 24, 2021",
    "April 17, 2021",
    "March 25, 2021",
  ];
</script>

<style>
  .lesson-date {
    margin: 10px 10px 5px;
    color: #171717;
    font-size: 0.875rem;
    font-weight: 400;
  }
  .class {
    max-width: 600px;
    margin: 0 auto;
    padding: 0 40px;
  }

  .lecture {
    border: 1px solid var(--border-color);
    padding: 15px;
    margin-bottom: 20px;
    border-radius: 6px;
  }

  .lecture-title {
    width: fit-content;
    font-size: 18px;
    color: var(--main-primary-color);
  }

  span {
    color: #586069;
    font-size: 12px;
    width: 40px;
  }
</style>

<div class="class">
  {#each lectures as lecture, key}
    <p class="lesson-date">{lecture}</p>
    <div class="lecture">
      <h4 class="lecture-title">
        <a rel="prefetch" href="classes/1">Lecture {lectures.length - key}</a>
      </h4>
      <p>
        Here is some description about the course that you should know. It will
        begin on the first and end on the second of the next month.
      </p>
      <div class="flex mt-3 mb-2">
        <span class="flex mr-2"><Education16 class="mr-2" />
          5</span>
        <span class="flex"><Catalog16 class="mr-2" />
          20</span>
      </div>
    </div>
  {/each}
</div>
