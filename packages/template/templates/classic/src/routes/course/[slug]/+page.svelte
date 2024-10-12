<!-- <script>
  export let data;

  const { courseData } = data;
</script>

<div>
  <p>
    this is the title of the course {courseData.title}
  </p>
  <p>
    this is the description of the course {courseData.description}
  </p>
</div> -->

<script>
  import { onMount } from 'svelte';

  export let data;

  const { metadata, lessons, dataSlug } = data;

  let selectedLesson = lessons[0].filename; // First lesson selected by default
  let lessonContent = ''; // Will load content on mount

  // Fetch lesson content
  async function loadLessonContent(filename) {
    const response = await fetch(`/src/lib/courses/${dataSlug}/${filename}`);
    const text = await response.text();

    // Remove front matter before displaying content
    lessonContent = text.replace(/^----\ntitle:\s*(.+?)\n----/, '');
    selectedLesson = filename;
  }

  // Fetch the first lesson content when the component mounts
  onMount(() => {
    loadLessonContent(lessons[0].filename);
  });
  $: console.log('array', lessons, metadata);
</script>

<h1>{metadata.title}</h1>
<p>{metadata.description}</p>

<h2>Lessons:</h2>
<ul>
  {#each lessons as lesson}
    <li>
      <button on:click={() => loadLessonContent(lesson.filename)}>
        {lesson.title}
      </button>
    </li>
  {/each}
</ul>

{#if selectedLesson}
  <h2>Selected Lesson: {selectedLesson}</h2>
  <div>{@html lessonContent}</div>
{/if}
