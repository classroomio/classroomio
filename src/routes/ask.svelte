<script>
  import ChevronDown24 from "carbon-icons-svelte/lib/ChevronDown24";
  import TextEditor from "../components/TextEditor.svelte";

  let questionTitle = "";
  let questionDescription = "";
  let facultyFilterOpened = false;

  const faculties = [
    "ИЭКСУ",
    "ИМБТ",
    "ИМИ",
    "ИПТДМ",
    "ИИИР",
    "ГФ",
    "ХТФ",
    "ИДЗО",
    "УИИ",
    "УНИ",
  ];
  let checkbox = faculties.reduce((acc, cur) => {
    acc[cur] = false;
    return acc;
  }, {});
  $: clickedTotal = Object.values(checkbox).filter((box) => !!box).length;

  function handleFacultyFilters() {
    facultyFilterOpened = facultyFilterOpened ? false : true;
  }
</script>

<svelte:head>
  <title>Спросить собшество вопрос</title>
</svelte:head>

<div class="lg:w-3/5 mx-auto md:mx-10 lg:mb-20">
  <h2 class="pb-2">Спросить собшество вопрос</h2>
  <div class="main-title my-1 flex">
    <div class="faculty-filter mr-1">
      <button
        class="flex border rounded-lg border-grey py-2 px-3 focus:outline-none focus:border-gray-400 focus:bg-gray-200 relative"
        on:click={handleFacultyFilters}
      >
        <span class="flex flex-row"
          >Факултеты <span>&nbsp;({clickedTotal})</span></span
        >
        <ChevronDown24 class="ml-2" />
      </button>

      {#if facultyFilterOpened}
        <div
          class="w-48 bg-white border border-grey rounded-lg mt-2 py-2 absolute"
        >
          {#each faculties as faculty}
            <div class="block px-4 py-2 border-b">
              <input
                type="checkbox"
                class="border border-gray checked:bg-blue-600 checked:border-transparent mr-1 cursor-pointer"
                bind:checked={checkbox[faculty]}
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

<style>
  @media only screen and (max-width: 1002px) {
    .faculty-filter {
      margin-bottom: 10px;
    }
    .main-title {
      flex-direction: column;
    }
  }
</style>
