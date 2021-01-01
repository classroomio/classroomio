<script context="module">
  import ChevronDown24 from "carbon-icons-svelte/lib/ChevronDown24";
	import TextEditor from "../components/TextEditor.svelte";

  let questionTitle = '';
  let questionTags = [];
  let questionDescription = '';

  const faculties = [
    'ИЭКСУ', 'ИМБТ', 'ИМИ', 'ИПТДМ', 'ИИИР', 'ГФ', 'ХТФ', 'ИДЗО', 'УИИ', 'УНИ'
  ];
</script>

<svelte:head>
	<title>Спросить собшество вопрос</title>
</svelte:head>

<div class="lg:w-3/5 mx-auto md:mx-10 lg:mb-20">
  <h2 class="pb-2">Спросить собшество вопрос</h2>
  <div class="my-1 px-1">
    <button class="flex border rounded-lg border-grey py-1 px-3 focus:outline-none focus:border-gray-400 focus:bg-gray-200">
      <span>Факултеты</span> <ChevronDown24 class="ml-2" />
    </button>
    <div class="w-48 bg-white border border-grey rounded-lg mt-2 py-2">
      {#each faculties as faculty}
        <div class="block px-4 py-2 border-b">
          <input type="checkbox" class="border border-gray checked:bg-blue-600 checked:border-transparent mr-1 cursor-pointer">
          <span>{faculty}</span>
        </div>
      {/each}
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
      value="{questionTitle}"
    >
  </div>

  <TextEditor
    value="{questionDescription}"
    placeholder="Задайте вопрос или начните разговор"
  />
</div>