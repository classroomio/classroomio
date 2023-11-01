<script lang="ts">
  import { onDestroy } from 'svelte';
  import { writable } from 'svelte/store';

  import { fade, fly } from 'svelte/transition';
  import WhitePaper from 'carbon-icons-svelte/lib/WhitePaper.svelte';
  import ColorPalette from 'carbon-icons-svelte/lib/ColorPalette.svelte';
  import View from 'carbon-icons-svelte/lib/View.svelte';
  import Undo from 'carbon-icons-svelte/lib/Undo.svelte';
  import Redo from 'carbon-icons-svelte/lib/Redo.svelte';
  import OverflowMenuVertical from 'carbon-icons-svelte/lib/OverflowMenuVertical.svelte';
  import Image from 'carbon-icons-svelte/lib/Image.svelte';
  import Link from 'carbon-icons-svelte/lib/Link.svelte';
  import AddAlt from 'carbon-icons-svelte/lib/AddAlt.svelte';
  import DocumentImport from 'carbon-icons-svelte/lib/DocumentImport.svelte';
  import TextSmallCaps from 'carbon-icons-svelte/lib/TextSmallCaps.svelte';
  import MediaLibrary from 'carbon-icons-svelte/lib/MediaLibrary.svelte';
  import Copy from 'carbon-icons-svelte/lib/Copy.svelte';
  import TrashCan from 'carbon-icons-svelte/lib/TrashCan.svelte';
  import { OverflowMenu, OverflowMenuItem, Toggle } from 'carbon-components-svelte';
  import Modal from '$lib/components/Modal/index.svelte';
  import Checkbox from '$lib/components/Form/Checkbox.svelte';
  import Tabs from '$lib/components/Tabs/index.svelte';
  import TabContent from '$lib/components/TabContent/index.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import RadioItem from '$lib/components/Form/RadioItem.svelte';
  import AutoGrowTextField from '$lib/components/Form/AutoGrowTextField.svelte';
  import Select from '$lib/components/Form/Select.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import UploadWidget from '$lib/components/UploadWidget/index.svelte';
  import { handleOpenWidget } from '$lib/components/CourseLandingPage/store';
  import { QuestionTypesArray } from '../store.js';

  export let data;

  let formId = data.form.id;

  let isInputOptions = false;
  let isBold = false;
  let isItalics = false;
  let isUnderline = false;
  let isLink = false;
  let isUndoFormatting = false;
  let linkDisplay = '';
  let textLink = '';
  let tabsPosition = 'justify-center';
  let activeButton = 'text-black bg-gray-100';
  let options = QuestionTypesArray;
  let selectedQuestionType = QuestionTypesArray[0];
  const tabs = [
    { label: 'Questions', value: 'questions' },
    { label: 'Responses', value: 'responses' },
    { label: 'Settings', value: 'settings' }
  ];
  let currentTab = tabs[0].value;
  const onChange = (tabValue: string) => () => (currentTab = tabValue);

  let questions = writable(data.form?.questions || []);

  // adds a new question tab
  function handleAddQuestion(formId: string) {
    const newQuestion = {
      title: '',
      name: '',
      points: 0,
      order: 0,
      question_type: '',
      options: [],
      isRequired: false
    };

    questions.update((currentQuestions) => {
      return [...currentQuestions, newQuestion];
    });
  }

  // duplicate the question tab
  function handleDuplicateQuestion(title: string) {
    const formToDuplicate = $questions.find((question) => question.title === title);

    if (formToDuplicate) {
      // Get the index of the original question in the array
      const originalIndex = $questions.indexOf(formToDuplicate);

      // Duplicate the form
      const duplicatedForm = { ...formToDuplicate };

      // Create a new array with the duplicated form inserted right after the original form
      const updatedQuestions = [
        ...$questions.slice(0, originalIndex + 1), // Questions before the original
        duplicatedForm, // Duplicated question
        ...$questions.slice(originalIndex + 1) // Questions after the original
      ];

      questions.set(updatedQuestions);
    }
  }

  // delete question tab
  function handleDeleteQuestion(title: string) {
    questions.update((allQuestions) => {
      const indexToDelete = allQuestions.findIndex((question) => question.title === title);

      if (indexToDelete !== -1) {
        allQuestions.splice(indexToDelete, 1);
      }

      return allQuestions;
    });
  }
  let widgetStates = Array($questions.length).fill(false);

  // i had to had index because of the specific question in the array of questions. When this function is called with an index, it toggles the state of the widget associated with that question.
  function widgetControl(index: number) {
    if (index >= 0 && index < $questions.length) {
      // Toggle the state
      widgetStates[index] = !widgetStates[index];

      // Create a copy of the widgetStates array and set handleOpenWidget to true or false for the specific question
      handleOpenWidget.set({
        open: widgetStates[index]
      });
    }
  }

  // make question required tab
  function handleRequired() {}

  document.addEventListener('click', handleDocumentClick);
  function handleDocumentClick(e) {
    if (!e.target.closest('.text-editor')) {
      isInputOptions = false;
    }
  }

  onDestroy(() => {
    // Clean up the event listener when the component is destroyed
    document.removeEventListener('click', handleDocumentClick);
  });
</script>

<header class="flex justify-between w-full px-10">
  <div class="flex gap-5 items-center">
    <WhitePaper size={32} class="scale-[2]" />
    <h1 class="ml-10">{data.form?.title}</h1>
  </div>
  <div class="flex gap-5 items-center">
    <ColorPalette size={24} />
    <View size={24} />
    <Undo size={24} />
    <Redo size={24} />
    <button class="py-2 px-5 bg-primary-700 rounded-md text-white font-medium">Send</button>
    <OverflowMenuVertical />
    <p class="px-4 py-2.5 rounded-full bg-primary-700 text-white">T</p>
  </div>
</header>

<div class="w-full bg-white dark:bg-inherit p-5">
  <Tabs {tabs} {currentTab} {onChange} {tabsPosition}>
    <slot:fragment slot="content">
      <TabContent value={tabs[0].value} index={currentTab}>
        <div class="mx-auto w-[70%]">
          <div
            class="border shadow-md border-primary-500 border-b-0 border-r-0 border-l-0 border-t-8 p-3 w-full rounded-md"
          >
            <h1>{data.form?.title}</h1>
            <p>Form Description</p>
          </div>
          {#if $questions}
            {#each $questions as mockQuestion, index}
              <button class="text-left w-full" id={mockQuestion.title}>
                <div class="relative mt-10 min-h-[30vh] w-full">
                  <div class="w-full border shadow-md rounded-md min-h-[43vh] py-4 px-5">
                    <div class="flex gap-7 items-center relative pb-9">
                      <AutoGrowTextField
                        placeholder="Question"
                        value={mockQuestion.title}
                        inputClassName="text-editor text-sm w-[30rem] {isBold
                          ? 'font-bold'
                          : 'font-normal'} {isItalics ? 'italic' : 'non-italic'} {isUnderline
                          ? 'underline'
                          : 'no-underline'} {isUndoFormatting ? 'unset' : ''}"
                        onClick={() => {
                          isInputOptions = true;
                          console.log(isInputOptions);
                        }}
                      />
                      {#if isInputOptions}
                        <div
                          class="flex gap-7 items-center text-black absolute left-[5%] bottom-0"
                          in:fly={{ y: 5, duration: 1000 }}
                          out:fade
                        >
                          <button
                            class="text-editor {isBold
                              ? activeButton
                              : ''} text-lg font-semibold text-gray-500 hover:text-black px-3.5 py-0.5 rounded-md hover:bg-gray-100 transition-all cursor-pointer"
                            on:click={() => (isBold = !isBold)}
                          >
                            B
                          </button>
                          <button
                            class="text-editor {isItalics
                              ? activeButton
                              : ''} text-lg font-semibold text-gray-500 hover:text-black px-3.5 py-0.5 rounded-md hover:bg-gray-100 transition-all cursor-pointer"
                            on:click={() => (isItalics = !isItalics)}
                          >
                            I
                          </button>
                          <button
                            class="text-editor {isUnderline
                              ? activeButton
                              : ''} underline text-lg font-semibold text-gray-500 hover:text-black px-3.5 py-0.5 rounded-md hover:bg-gray-100 transition-all cursor-pointer"
                            on:click={() => (isUnderline = !isUnderline)}
                          >
                            U
                          </button>
                          <button
                            class="text-editor underline text-lg font-semibold text-gray-500 hover:text-black px-2.5 py-0.5 rounded-md hover:bg-gray-100 transition-all cursor-pointer"
                            on:click={() => (isLink = !isLink)}
                          >
                            <Link size={24} class="cursor-pointer text-editor" />
                          </button>

                          <Modal bind:open={isLink} onClose={() => (isLink = !isLink)} width="30px">
                            <TextField label="Text to display" bind:value={linkDisplay} />
                            <br />
                            <TextField label="Link to" bind:value={textLink} />
                            <div class="flex gap-5 mt-5">
                              <button>Cancel</button>
                              <button
                                class="text-primary-700"
                                on:click={() => {
                                  // question.title = textLink;
                                  isLink = !isLink;
                                }}>OK</button
                              >
                            </div>
                          </Modal>

                          <button
                            class="text-editor line-through text-lg font-semibold text-gray-500 hover:text-black px-3.5 py-0.5 rounded-md hover:bg-gray-100 transition-all cursor-pointer"
                            on:click={() => (isUndoFormatting = !isUndoFormatting)}
                          >
                            T
                          </button>
                        </div>
                      {/if}
                      <IconButton
                        toolTipProps={{ title: 'Add Image', hotkeys: ['A', '5'] }}
                        onClick={() => widgetControl(index)}
                      >
                        <Image size={20} class="cursor-pointer hover:scale-110 transition-all" />
                      </IconButton>
                      <Select {options} labelKey="label" value={selectedQuestionType} />
                    </div>

                    <div class="mb-5">
                      {#if widgetStates[index]}
                        <UploadWidget bind:imageURL={mockQuestion.image} />
                      {/if}

                      <!-- conditional rendering for images/videos -->
                      {#if mockQuestion.image !== ''}
                        <img src={mockQuestion.image} alt="" />
                      {/if}
                    </div>

                    <!-- consitional rendering -->
                    <div>
                      {#if mockQuestion.question_type === 'checkboxes'}
                        {#each mockQuestion.options as option (option.label)}
                          <Checkbox
                            isEditable={true}
                            name="checkbox"
                            label={option.label}
                            value={option.value}
                          />
                        {/each}
                        <!-- <Checkbox isEditable={true} name="checkbox" label="Add Option" /> -->
                      {:else if mockQuestion.question_type === 'shortAnswer'}
                        <AutoGrowTextField
                          isEditable={true}
                          placeholder="Short Answer Text"
                          value=""
                          inputClassName="w-[35%]"
                        />
                      {:else if mockQuestion.question_type === 'paragraph'}
                        <AutoGrowTextField
                          isEditable={true}
                          placeholder="Long Answer Text"
                          value=""
                        />
                      {:else if mockQuestion.question_type === 'multipleChoice'}
                        {#each mockQuestion.options as option (option.label)}
                          <RadioItem label={option.label} value={option.value} />
                          <!-- <br /> -->
                          <!-- <RadioItem label="Add Option" isEditable={false} /> -->
                        {/each}
                      {:else if mockQuestion.question_type === 'dropdown'}
                        {#each mockQuestion.options as option (option.label)}
                          <TextField
                            placeholder="Option 1"
                            className="w-[40%]"
                            label={option.label}
                            value={option.value}
                          />
                          <!-- <TextField placeholder="Option 2" className="w-[40%]" /> -->
                        {/each}
                      {:else if mockQuestion.question_type === 'fileUpload'}
                        <h1>Let respondents upload files to Drive</h1>
                        <p>
                          Files will be uploaded to the form owner's Google Drive. Respondents will
                          be required to sign in to Google when file upload questions are added to a
                          form. Make sure to only share this form with people you trust.
                        </p>
                      {/if}
                    </div>

                    <div class="w-full absolute bottom-3 left-0 flex items-center justify-end">
                      <div class="w-[13%] flex items-center gap-6">
                        <button on:click={() => handleDuplicateQuestion(mockQuestion.title)}>
                          <Copy size={20} class="cursor-pointer hover:scale-110 transition-all" />
                        </button>
                        <button on:click={() => handleDeleteQuestion(mockQuestion.title)}>
                          <TrashCan
                            size={20}
                            class="cursor-pointer hover:scale-110 transition-all"
                          />
                        </button>
                      </div>
                      <div class="w-[25%] flex flex-row items-center gap-3 border-l-2 pr-5">
                        <Toggle
                          bind:toggled={mockQuestion.isRequired}
                          hideLabel={true}
                          class="scale-[0.6]"
                        >
                          <span slot="labelA" class="text-xl">Required</span>
                          <span slot="labelB" class="text-xl">Required</span>
                        </Toggle>

                        <OverflowMenu size="sm">
                          <OverflowMenuItem text="Description" />
                          <OverflowMenuItem text="Go to section based on answer" />
                          <OverflowMenuItem text="Shuffle option order" />
                        </OverflowMenu>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            {/each}
          {/if}

          <!-- sidebar -->
          <div
            class="fixed right-[9%] bottom-10 w-12 flex flex-col items-center h-[34%] gap-1 border rounded-md"
          >
            <IconButton
              toolTipProps={{ title: 'Add Question', hotkeys: ['A', '2'] }}
              onClick={() => handleAddQuestion(formId)}
            >
              <AddAlt size={20} class="cursor-pointer hover:scale-110 transition-all" />
            </IconButton>
            <IconButton
              toolTipProps={{ title: 'Import Question', hotkeys: ['A', '3'] }}
              onClick={() => handleAddQuestion(formId)}
            >
              <DocumentImport
                size={20}
                class="cursor-pointer hover:scale-110 transition-all"
              /></IconButton
            >
            <IconButton
              toolTipProps={{ title: 'Add Description', hotkeys: ['A', '4'] }}
              onClick={() => handleAddQuestion(formId)}
            >
              <TextSmallCaps
                size={20}
                class="cursor-pointer hover:scale-110 transition-all"
              /></IconButton
            >
            <IconButton
              toolTipProps={{ title: 'Add Image', hotkeys: ['A', '5'] }}
              onClick={() => widgetControl()}
            >
              <Image size={20} class="cursor-pointer hover:scale-110 transition-all" />
            </IconButton>
            <IconButton
              toolTipProps={{ title: 'Add Video', hotkeys: ['A', '6'] }}
              onClick={() => handleAddQuestion(formId)}
            >
              <MediaLibrary
                size={20}
                class="cursor-pointer hover:scale-110 transition-all"
              /></IconButton
            >
          </div>
        </div>
      </TabContent>
      <TabContent value={tabs[1].value} index={currentTab}>Responses</TabContent>
      <TabContent value={tabs[2].value} index={currentTab}>Settings</TabContent>
    </slot:fragment>
  </Tabs>
</div>
