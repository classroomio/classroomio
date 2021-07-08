<script>
  import Time24 from "carbon-icons-svelte/lib/Time24";
  import Edit24 from "carbon-icons-svelte/lib/Edit24";
  import Save24 from "carbon-icons-svelte/lib/Save24";
  import CheckmarkFilled24 from "carbon-icons-svelte/lib/CheckmarkFilled24";
  import PageNav from "../../../../PageNav/index.svelte";
  import PageBody from "../../../../PageBody/index.svelte";
  import PrimaryButton from "../../../../PrimaryButton/index.svelte";
  import TextField from "../../../../Form/TextField.svelte";
  import IconButton from "../../../../IconButton/index.svelte";
  import Select from "../../../../Form/Select.svelte";

  import { lessons, lecturers, handleAddLesson } from "../store/lessons";

  // export let path;

  let lectureEditing;
  let ref;

  function formatDate(date) {
    const d = new Date(date);

    const ye = new Intl.DateTimeFormat("en", { year: "numeric" }).format(d);
    const mo = new Intl.DateTimeFormat("en", { month: "2-digit" }).format(d);
    const da = new Intl.DateTimeFormat("en", { day: "2-digit" }).format(d);

    return `${ye}-${mo}-${da}`;
  }

  function addLesson() {
    handleAddLesson();
    setTimeout(() => {
      lectureEditing = $lessons.length - 1;
      if (ref) {
        ref.scrollIntoView({ block: "end", behavior: "smooth" });
      }
    }, 100);
  }
</script>

<PageNav title="Lectures">
  <div slot="widget">
    <PrimaryButton label="Add" onClick={addLesson} />
  </div>
</PageNav>

<PageBody width="w-11/12 m-auto">
  <div class="w-4/5 m-auto">
    {#each $lessons as lecture, index}
      <div
        bind:this={ref}
        class="group relative m-auto rounded-md border-2 border-gray-100 py-3 px-5 mr-4 mb-4 flex items-center hover:shadow-2xl shadow-md transition delay-150 duration-300 ease-in-out"
      >
        <!-- Complete or Not complete icon -->
        <div class="absolute -left-5 -top-5 success">
          <IconButton
            onClick={() => (lecture.isComplete = !lecture.isComplete)}
          >
            {#if lecture.isComplete}
              <CheckmarkFilled24 class="carbon-icon" />
            {:else}
              <span class="text-2xl">🔒</span>
            {/if}
          </IconButton>
        </div>

        <!-- Edit/Save -->
        <div class="absolute top-2 right-0">
          {#if lectureEditing === index}
            <IconButton onClick={() => (lectureEditing = null)}>
              <Save24 class="carbon-icon" />
            </IconButton>
          {:else}
            <IconButton onClick={() => (lectureEditing = index)}>
              <Edit24 class="carbon-icon" />
            </IconButton>
          {/if}
        </div>

        <div class="">
          <h3 class="text-4xl font-bold">{index + 1}</h3>
        </div>
        <div class="ml-8 w-4/5">
          {#if lectureEditing === index}
            <TextField bind:value={lecture.title} autofocus={true} />
          {:else}
            <h3 class="text-3xl font-semibold m-0 flex items-center">
              <a href={lecture.to} class="hover:underline text-black">
                {lecture.title}
              </a>
            </h3>
          {/if}
          <div class="flex items-center mb-2">
            <div class="flex items-center mr-2">
              {lecture.resources.map((r) => `${r.value} ${r.label}`).join(", ")}
            </div>
          </div>

          <div class="flex items-center justify-between mt-3 w-full">
            {#if lectureEditing === index}
              <Select
                bind:value={lecture.lecturer.name}
                options={$lecturers}
                valueKey="text"
              />
            {:else}
              <a
                href="courses/1/people"
                class="flex items-center hover:underline text-black"
              >
                <img
                  alt="Placeholder"
                  class="block rounded-full"
                  width="24"
                  height="20"
                  src={lecture.lecturer.avatar}
                />
                <p class="ml-2 text-sm font-bold">{lecture.lecturer.name}</p>
              </a>
            {/if}

            <div class="flex items-center">
              {#if lectureEditing === index}
                <input
                  type="date"
                  name="lecture-date-picker"
                  class="p-2 rounded-md w-40"
                  value={formatDate(lecture.date)}
                  on:input={(e) => (lecture.date = e.target.value)}
                />
              {:else}
                <Time24 class="carbon-icon" />
                <p class="text-md font-semibold ml-2">
                  {new Date(lecture.date).toDateString()}
                </p>
              {/if}
            </div>
          </div>
        </div>
      </div>
    {/each}
  </div>
</PageBody>

<style>
  .group {
    min-height: 170px;
  }
</style>
