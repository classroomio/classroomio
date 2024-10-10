<script lang="ts">
  import { onMount } from 'svelte';

  let youtubeUrl = '';
  let course: {
    title: string;
    description: string;
    totalDuration: string;
    lessons: {
      title: string;
      duration: string;
      content: string;
      quiz: {
        question: string;
        options: string[];
        correctAnswer: string;
      }[];
    }[];
    transcript: string;
  } | null = null;
  let isLoading = false;
  let error = '';
  let editingLesson: number | null = null;
  let editingQuiz: { lesson: number; question: number } | null = null;

  async function handleSubmit() {
    isLoading = true;
    error = '';
    course = null;

    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ youtubeUrl })
      });

      if (!response.ok) {
        throw new Error('Failed to convert video');
      }

      course = await response.json();
    } catch (err) {
      error = err instanceof Error ? err.message : 'An unknown error occurred';
    } finally {
      isLoading = false;
    }
  }

  function startEditingLesson(index: number) {
    editingLesson = index;
    editingQuiz = null;
  }

  function saveLesson(index: number) {
    editingLesson = null;
  }

  function startEditingQuiz(lessonIndex: number, questionIndex: number) {
    editingQuiz = { lesson: lessonIndex, question: questionIndex };
    editingLesson = null;
  }

  function saveQuiz(lessonIndex: number, questionIndex: number) {
    editingQuiz = null;
  }

  function addNewLesson() {
    if (course) {
      course.lessons = [
        ...course.lessons,
        {
          title: 'New Lesson',
          duration: '00:00',
          content: 'Enter lesson content here',
          quiz: []
        }
      ];
    }
  }

  function addNewQuizQuestion(lessonIndex: number) {
    if (course) {
      course.lessons[lessonIndex].quiz = [
        ...course.lessons[lessonIndex].quiz,
        {
          question: 'New question',
          options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
          correctAnswer: 'Option 1'
        }
      ];
    }
  }

  function deleteLesson(index: number) {
    if (course) {
      course.lessons = course.lessons.filter((_, i) => i !== index);
    }
  }

  function deleteQuizQuestion(lessonIndex: number, questionIndex: number) {
    if (course) {
      course.lessons[lessonIndex].quiz = course.lessons[lessonIndex].quiz.filter(
        (_, i) => i !== questionIndex
      );
    }
  }

  async function saveCourse() {
    if (!course) return;

    try {
      const response = await fetch('/api/convert', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(course)
      });

      if (!response.ok) {
        throw new Error('Failed to save course');
      }

      const result = await response.json();
      alert('Course saved successfully!');
    } catch (err) {
      error = err instanceof Error ? err.message : 'An unknown error occurred';
    }
  }
</script>

<div class="bg-white shadow sm:rounded-lg">
  <div class="px-4 py-5 sm:p-6">
    <h3 class="text-lg leading-6 font-medium text-gray-900">Convert YouTube Tutorial to Course</h3>
    <div class="mt-2 max-w-xl text-sm text-gray-500">
      <p>Enter a YouTube video URL to convert it into a structured course.</p>
    </div>
    <form class="mt-5 sm:flex sm:items-center" on:submit|preventDefault={handleSubmit}>
      <div class="w-full sm:max-w-xs">
        <label for="youtube-url" class="sr-only">YouTube URL</label>
        <input
          type="text"
          name="youtube-url"
          id="youtube-url"
          class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
          placeholder="https://www.youtube.com/watch?v=..."
          bind:value={youtubeUrl}
        />
      </div>
      <button
        type="submit"
        class="mt-3 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
        disabled={isLoading}
      >
        {isLoading ? 'Converting...' : 'Convert'}
      </button>
    </form>

    {#if error}
      <p class="mt-4 text-sm text-red-600">{error}</p>
    {/if}

    {#if course}
      <div class="mt-8">
        <h4 class="text-xl font-semibold">{course.title}</h4>
        <p class="mt-2 text-sm text-gray-500">Total Duration: {course.totalDuration}</p>
        <p class="mt-2 text-sm">{course.description}</p>
        <h5 class="mt-4 text-lg font-medium">Lessons:</h5>
        <ul class="mt-2 space-y-4">
          {#each course.lessons as lesson, lessonIndex}
            <li class="bg-gray-50 p-4 rounded">
              {#if editingLesson === lessonIndex}
                <input
                  bind:value={lesson.title}
                  class="font-medium text-lg w-full mb-2 p-1 border rounded"
                />
                <textarea bind:value={lesson.content} class="w-full h-32 p-1 border rounded"
                ></textarea>
                <button
                  on:click={() => saveLesson(lessonIndex)}
                  class="mt-2 px-2 py-1 bg-green-500 text-white rounded"
                >
                  Save Lesson
                </button>
              {:else}
                <h6 class="font-medium text-lg">
                  {lessonIndex + 1}. {lesson.title}
                  <button
                    on:click={() => startEditingLesson(lessonIndex)}
                    class="ml-2 px-2 py-1 bg-blue-500 text-white rounded text-sm"
                  >
                    Edit
                  </button>
                  <button
                    on:click={() => deleteLesson(lessonIndex)}
                    class="ml-2 px-2 py-1 bg-red-500 text-white rounded text-sm"
                  >
                    Delete
                  </button>
                </h6>
                <p class="text-sm text-gray-500 mt-1">Duration: {lesson.duration}</p>
                <p class="text-sm mt-2">{lesson.content.substring(0, 200)}...</p>
              {/if}

              <h7 class="font-medium text-md mt-4 block">Quiz:</h7>
              <ul class="mt-2 space-y-2">
                {#each lesson.quiz as quizItem, quizIndex}
                  <li>
                    {#if editingQuiz && editingQuiz.lesson === lessonIndex && editingQuiz.question === quizIndex}
                      <input
                        bind:value={quizItem.question}
                        class="font-medium w-full mb-2 p-1 border rounded"
                      />
                      {#each quizItem.options as option, optionIndex}
                        <input
                          bind:value={quizItem.options[optionIndex]}
                          class="w-full mb-1 p-1 border rounded"
                        />
                      {/each}
                      <select
                        bind:value={quizItem.correctAnswer}
                        class="w-full mb-2 p-1 border rounded"
                      >
                        {#each quizItem.options as option}
                          <option value={option}>{option}</option>
                        {/each}
                      </select>
                      <button
                        on:click={() => saveQuiz(lessonIndex, quizIndex)}
                        class="px-2 py-1 bg-green-500 text-white rounded"
                      >
                        Save Question
                      </button>
                    {:else}
                      <p class="font-medium">
                        {quizIndex + 1}. {quizItem.question}
                        <button
                          on:click={() => startEditingQuiz(lessonIndex, quizIndex)}
                          class="ml-2 px-2 py-1 bg-blue-500 text-white rounded text-sm"
                        >
                          Edit
                        </button>
                        <button
                          on:click={() => deleteQuizQuestion(lessonIndex, quizIndex)}
                          class="ml-2 px-2 py-1 bg-red-500 text-white rounded text-sm"
                        >
                          Delete
                        </button>
                      </p>
                      <ul class="ml-4 mt-1">
                        {#each quizItem.options as option, optionIndex}
                          <li class="text-sm">
                            {String.fromCharCode(97 + optionIndex)}. {option}
                          </li>
                        {/each}
                      </ul>
                    {/if}
                  </li>
                {/each}
              </ul>
              <button
                on:click={() => addNewQuizQuestion(lessonIndex)}
                class="mt-2 px-2 py-1 bg-purple-500 text-white rounded"
              >
                Add New Question
              </button>
            </li>
          {/each}
        </ul>
        <button on:click={addNewLesson} class="mt-4 px-4 py-2 bg-indigo-600 text-white rounded">
          Add New Lesson
        </button>
        <button on:click={saveCourse} class="mt-4 px-4 py-2 bg-green-600 text-white rounded">
          Save Course
        </button>
      </div>
    {/if}
  </div>
</div>
