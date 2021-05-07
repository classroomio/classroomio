<script>
  import Education16 from "carbon-icons-svelte/lib/Education16";
  import Catalog16 from "carbon-icons-svelte/lib/Catalog16";
  import Chip from "../Chip/index.svelte";

  export let courses = [
    {
      chipClassName: "bg-green-600 text-white",
      chipLabel: "In progress",
    },
    {
      chipClassName: "bg-red-600 text-white",
      chipLabel: "Completed",
    },
  ];
</script>

<div class="courses">
  {#each courses as courseData, index}
    <div class="course">
      <h4 class="course-title">
        <a rel="prefetch" href="courses/1"
          >QA Automation 0{courses.length - index}</a
        >
        <Chip
          value={courseData.chipLabel}
          className={courseData.chipClassName}
        />
      </h4>
      <p>
        Here is some description about the course that you should know. It will
        begin on the first and end on the second of the next month.
      </p>
      <div class="flex mt-3 mb-2">
        <span class="flex mr-2"
          ><Education16 class="mr-2" />
          5</span
        >
        <span class="flex"
          ><Catalog16 class="mr-2" />
          20</span
        >
      </div>
    </div>
  {/each}
</div>

<style>
  .courses {
    max-width: 600px;
    margin: 0 auto;
    padding: 0 40px;
  }

  .course {
    border-bottom: 1px solid var(--border-color);
    padding: 5px 0 10px;
  }

  .course-title {
    width: fit-content;
    font-size: 18px;
  }

  span {
    color: #586069;
    font-size: 12px;
    width: 40px;
  }
</style>
