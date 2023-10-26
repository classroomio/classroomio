<script lang="ts">
  import { onDestroy } from 'svelte';
  import { fade, fly } from 'svelte/transition';

  import WhitePaper from 'carbon-icons-svelte/lib/WhitePaper.svelte';
  import Folder from 'carbon-icons-svelte/lib/Folder.svelte';
  import Star from 'carbon-icons-svelte/lib/Star.svelte';
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
  import Table from 'carbon-icons-svelte/lib/Table.svelte';
  import Copy from 'carbon-icons-svelte/lib/Copy.svelte';
  import TrashCan from 'carbon-icons-svelte/lib/TrashCan.svelte';

  import { ToggleSkeleton } from 'carbon-components-svelte';

  import Modal from '$lib/components/Modal/index.svelte';
  import Checkbox from '$lib/components/Form/Checkbox.svelte';
  import Tabs from '$lib/components/Tabs/index.svelte';
  import TabContent from '$lib/components/TabContent/index.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import RadioItem from '$lib/components/Form/RadioItem.svelte';
  import AutoGrowTextField from '$lib/components/Form/AutoGrowTextField.svelte';
  import Select from '$lib/components/Form/Select.svelte';

  import { mockQuestions } from '../store.js';

  export let data;

  let isInputOptions = false;
  let isBold = false;
  let isItalics = false;
  let isUnderline = false;
  let isLink = false;
  let isUndoFormatting = false;
  let linkDisplay = '';
  let textLink = '';
  // let selectValue: { value: string | number } = { value: 'checkboxes' };
  let tabsPosition = 'justify-center';
  let activeButton = 'text-black bg-gray-100';
  const tabs = [
    { label: 'Questions', value: 'questions' },
    { label: 'Responses', value: 'responses' },
    { label: 'Settings', value: 'settings' }
  ];
  const options = [
    { label: 'Checkboxes', value: 'checkboxes' },
    { label: 'Short Answer', value: 'shortAnswer' },
    { label: 'Paragraph', value: 'paragraph' },
    { label: 'Multiple Choice', value: 'multipleChoice' },
    { label: 'Dropdown', value: 'dropdown' },
    { label: 'File Upload', value: 'fileUpload' },
    { label: 'Linear Scale', value: 'linearScale' },
    { label: 'Multiple Choice Grid', value: 'multipleChoiceGrid' },
    { label: 'Checkbox Grid', value: 'checkboxGrid' },
    { label: 'Date', value: 'date' },
    { label: 'Time', value: 'time' }
  ];

  let currentTab = tabs[0].value;
  const onChange = (tabValue: string) => () => (currentTab = tabValue);

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
    <h1 class="ml-10">Untitled Form</h1>
    <Folder size={24} />
    <Star size={24} />
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
            <h1>Untitled Form</h1>
            <p>Form Description</p>
          </div>

          {#each $mockQuestions as mockQuestion}
            <div class="relative mt-10 min-h-[30vh] w-full">
              <div class="w-full border shadow-md rounded-md min-h-[43vh] py-4 px-5">
                <div class="flex gap-7 items-center relative pb-9">
                  <AutoGrowTextField
                    placeholder="Question"
                    value={mockQuestion.title}
                    inputClassName="text-editor w-[30rem] {isBold
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
                  <Image size={32} class="scale-[1.1]" />
                  <Select {options} bind:value={mockQuestion.question_type} />
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
                      inputClassName="w-[45%]"
                    />
                  {:else if mockQuestion.question_type === 'paragraph'}
                    <AutoGrowTextField isEditable={true} placeholder="Long Answer Text" value="" />
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
                      Files will be uploaded to the form owner's Google Drive. Respondents will be
                      required to sign in to Google when file upload questions are added to a form.
                      Make sure to only share this form with people you trust.
                    </p>
                  {/if}
                </div>

                <div class="w-[97%] absolute bottom-3 left-0 flex gap-6 items-center justify-end">
                  <Copy size={20} class="cursor-pointer hover:scale-110 transition-all" />
                  <TrashCan size={20} class="cursor-pointer hover:scale-110 transition-all" />
                  <div class="flex flex-row items-center gap-3 border-l-2 pl-4">
                    <p>Required</p>
                    <ToggleSkeleton />
                    <OverflowMenuVertical
                      size={20}
                      class="cursor-pointer hover:scale-110 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          {/each}

          <!-- sidebar -->
          <div
            class="fixed right-12 bottom-10 w-12 py-4 flex flex-col items-center h-[40vh] gap-5 border rounded-md"
          >
            <AddAlt size={32} class="cursor-pointer hover:scale-110 transition-all" />
            <DocumentImport size={32} class="cursor-pointer hover:scale-110 transition-all" />
            <TextSmallCaps size={32} class="cursor-pointer hover:scale-110 transition-all" />
            <Image size={32} class="cursor-pointer hover:scale-110 transition-all" />
            <MediaLibrary size={32} class="cursor-pointer hover:scale-110 transition-all" />
            <Table size={32} class="cursor-pointer hover:scale-110 transition-all" />
          </div>
        </div>
      </TabContent>
      <TabContent value={tabs[1].value} index={currentTab}>Responses</TabContent>
      <TabContent value={tabs[2].value} index={currentTab}>Settings</TabContent>
    </slot:fragment>
  </Tabs>
</div>
