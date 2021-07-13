<script context="module">
  export async function preload({ params }) {
    console.log("params", params);
    let [courseId, courseNavItem, lessonId] = params.id;
    const res = await this.fetch(`api/course?id=${courseId}`);
    const data = await res.json();

    if (res.status === 200) {
      return { courseId, courseData: data };
    } else {
      this.error(res.status, data.message);
    }
  }
</script>

<script>
  import Time24 from "carbon-icons-svelte/lib/Time24";
  import Edit24 from "carbon-icons-svelte/lib/Edit24";
  import Save24 from "carbon-icons-svelte/lib/Save24";
  import CheckmarkFilled24 from "carbon-icons-svelte/lib/CheckmarkFilled24";
  import PageNav from "../../../../components/PageNav/index.svelte";
  import PageBody from "../../../../components/PageBody/index.svelte";
  import PrimaryButton from "../../../../components/PrimaryButton/index.svelte";
  import TextField from "../../../../components/Form/TextField.svelte";
  import IconButton from "../../../../components/IconButton/index.svelte";
  import Select from "../../../../components/Form/Select.svelte";
  import CourseContainer from "../../../../components/CourseContainer/index.svelte";
  import {
    lessons,
    tutors,
    handleAddLesson,
  } from "../../../../components/Course/components/Lesson/store/lessons";

  export let courseData;

  let lessonEditing;
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
      lessonEditing = $lessons.length - 1;
      if (ref) {
        ref.scrollIntoView({ block: "end", behavior: "smooth" });
      }
    }, 100);
  }
</script>

<CourseContainer {courseData}>
  <PageNav title="Lessons">
    <div slot="widget">
      <PrimaryButton label="Add" onClick={addLesson} />
    </div>
  </PageNav>

  <PageBody width="w-11/12 m-auto">
    <div class="w-4/5 m-auto">
      {#each $lessons as lesson, index}
        <div
          bind:this={ref}
          class="group relative m-auto rounded-md border-2 border-gray-100 py-3 px-5 mr-4 mb-4 flex items-center hover:shadow-2xl shadow-md transition delay-150 duration-300 ease-in-out"
        >
          <!-- Complete or Not complete icon -->
          <div class="absolute -left-6 -top-6 success">
            <IconButton
              onClick={() => (lesson.isComplete = !lesson.isComplete)}
              toolTipProps={{
                title: `Click to ${lesson.isComplete ? "lock" : "unlock"}`,
                direction: "right",
              }}
            >
              {#if lesson.isComplete}
                <CheckmarkFilled24 class="carbon-icon" />
              {:else}
                <span class="text-2xl">🔒</span>
              {/if}
            </IconButton>
          </div>

          <!-- Edit/Save -->
          <div class="absolute top-2 right-0">
            {#if lessonEditing === index}
              <IconButton onClick={() => (lessonEditing = null)}>
                <Save24 class="carbon-icon" />
              </IconButton>
            {:else}
              <IconButton onClick={() => (lessonEditing = index)}>
                <Edit24 class="carbon-icon" />
              </IconButton>
            {/if}
          </div>

          <div class="">
            <h3 class="text-3xl font-bold">{index + 1}.</h3>
          </div>
          <div class="ml-8 w-4/5">
            {#if lessonEditing === index}
              <TextField bind:value={lesson.title} autofocus={true} />
            {:else}
              <h3 class="text-3xl font-semibold m-0 flex items-center">
                <a href={lesson.to} class="hover:underline text-black">
                  {lesson.title}
                </a>
              </h3>
            {/if}
            <div class="flex items-center mb-2">
              <div class="flex items-center mr-2">
                {lesson.resources
                  .map((r) => `${r.value} ${r.label}`)
                  .join(", ")}
              </div>
            </div>

            <div class="flex items-center justify-between mt-3 w-full">
              {#if lessonEditing === index}
                <Select
                  bind:value={lesson.tutor.name}
                  options={$tutors}
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
                    src={lesson.tutor.avatar}
                  />
                  <p class="ml-2 text-sm font-bold">{lesson.tutor.name}</p>
                </a>
              {/if}

              <div class="flex items-center">
                {#if lessonEditing === index}
                  <input
                    type="date"
                    name="lesson-date-picker"
                    class="p-2 rounded-md w-40"
                    value={formatDate(lesson.date)}
                    on:input={(e) => (lesson.date = e.target.value)}
                  />
                {:else}
                  <Time24 class="carbon-icon" />
                  <p class="text-md font-semibold ml-2">
                    {new Date(lesson.date).toDateString()}
                  </p>
                {/if}
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </PageBody>
</CourseContainer>

<style>
  .group {
    min-height: 170px;
  }
</style>
