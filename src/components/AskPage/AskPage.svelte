<script context="module">
  import ChevronDown24 from 'carbon-icons-svelte/lib/ChevronDown24';
  import TextEditor from '../TextEditor/index.svelte';

  let questionTitle = '';
  let questionTags = [];
  let questionDescription = '';
  let facultyFilterOpened = true;

  const faculties = [
    'ИЭКСУ',
    'ИМБТ',
    'ИМИ',
    'ИПТДМ',
    'ИИИР',
    'ГФ',
    'ХТФ',
    'ИДЗО',
    'УИИ',
    'УНИ',
  ];

  function handleFacultyFilters() {
    facultyFilterOpened = facultyFilterOpened ? false : true;
  }
  let things = [
    { id: 1, color: 'darkblue' },
    { id: 2, color: 'indigo' },
    { id: 3, color: 'deeppink' },
    { id: 4, color: 'salmon' },
    { id: 5, color: 'gold' },
  ];

  function handleClick() {
    things = things.slice(1);
  }
</script>

<svelte:head>
  <title>Ask a question.</title>
</svelte:head>

<div class="lg:w-3/5 mx-auto md:mx-10 lg:mb-20">
  <h2 class="pb-2">Ask a question.</h2>
  <div class="my-1 px-1">
    <div class="mb-5">
      <button on:click={handleClick}> Remove first thing </button>
      {#each things as thing}
        <p style="color: {thing.color}">{thing.id}</p>
      {/each}
      <button
        class="flex border rounded-lg border-grey py-1 px-3 focus:outline-none focus:border-gray-400 focus:bg-gray-200"
        on:click={handleFacultyFilters}
      >
        <span>Факултеты</span>
        <ChevronDown24 class="ml-2" />
      </button>

      {#if facultyFilterOpened}
        <div class="w-48 bg-white border border-grey rounded-lg mt-2 py-3">
          {#each faculties as faculty}
            <div class="block px-4 py-3 border-b">
              <input
                type="checkbox"
                class="border border-gray checked:bg-blue-600 checked:border-transparent mr-1 cursor-pointer"
              />
              <span>{faculty}</span>
            </div>
          {/each}
        </div>
      {/if}
    </div>
    <input
      class="title rounded-lg border border-1 border-gray p-2 w-full focus:outline-none"
      error="false"
      autocomplete="off"
      placeholder="Title"
      aria-label="Title"
      aria-describedby="title-input-validation"
      type="text"
      name="discussion[title]"
      id="discussion_title"
      value={questionTitle}
    />
  </div>

  <TextEditor
    value={questionDescription}
    placeholder="Задайте вопрос или начните разговор"
  />
</div>
