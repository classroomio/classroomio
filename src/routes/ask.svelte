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
    <button class="flex border rounded-lg border-grey">
      <span>Факултеты</span> <ChevronDown24 class="ml-2" />
    </button>
    <div>
      {#each faculties as faculty}
        <div>
          <input type="checkbox" class="appearance-none checked:bg-blue-600 checked:border-transparent">
          <span>{faculty}</span>
        </div>
      {/each}
    </div>
    <input
      class="title rounded-lg border border-1 border-gray p-1 w-full"
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