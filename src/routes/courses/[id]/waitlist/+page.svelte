<script lang="ts">
  import PageNav from '$lib/components/PageNav/index.svelte';
  import PageBody from '$lib/components/PageBody/index.svelte';
  import CourseContainer from '$lib/components/CourseContainer/index.svelte';
  import Tabs from '$lib/components/Tabs/index.svelte';
  import TabContent from '$lib/components/TabContent/index.svelte';
  import { Popover } from 'carbon-components-svelte';
  import LockedIcon from 'carbon-icons-svelte/lib/Locked.svelte';
  import { Tooltip } from 'carbon-components-svelte';

  import {
    Add,
    TrashCan,
    WatsonHealthStackedScrolling_1,
    OverflowMenuVertical,
    Copy,
    CheckmarkOutline,
    Link
  } from 'carbon-icons-svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { QUESTION_TYPE } from '$lib/components/Question/constants';
  import IntroQuestion from '$lib/components/Course/components/Waitlist/IntroQuestion.svelte';
  import RadioQuestion from '$lib/components/Course/components/Waitlist/RadioQuestion.svelte';
  import CheckboxQuestion from '$lib/components/Course/components/Waitlist/CheckboxQuestion.svelte';
  import FinalQuestion from '$lib/components/Course/components/Waitlist/FinalQuestion.svelte';
  import type { WaitlistQuestion } from '$lib/utils/types';

  export let data;

  const tabs = [
    { label: 'Create', value: 'create' },
    { label: 'Result', value: 'result' }
  ];
  let currentTab = tabs[0].value;
  let openPopover: { [key: string]: boolean } = {};
  let buttonClass =
    'flex items-center px-3 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md w-full mb-2 text-sm';
  let aiButtonRef: HTMLDivElement;

  const onChange = (tabValue: string) => () => (currentTab = tabValue);

  function handleAddOptions() {}

  let questions: WaitlistQuestion[] = [
    {
      id: 'uuid-1',
      no: 1,
      title: 'Do you need this course?',
      description: 'Check how well ',
      isPage: true
    },
    {
      id: 'uuid-2',
      no: 2,
      title: 'When was Facebook founded?',
      description: 'This is the first question',
      type: QUESTION_TYPE.CHECKBOX,
      isRequired: true,
      options: [
        {
          id: 'uuid-1',
          label: '2004',
          isCorrect: true
        },
        {
          id: 'uuid-2',
          label: '2005',
          isCorrect: false
        },
        {
          id: 'uuid-3',
          label: '2006',
          isCorrect: false
        },
        {
          id: 'uuid-4',
          label: '2007',
          isCorrect: false
        }
      ]
    },
    {
      id: 'uuid-3',
      no: 3,
      title: 'Who is the founder of Facebook?',
      description: 'This is the first question',
      type: QUESTION_TYPE.RADIO,
      isRequired: true,
      options: [
        {
          id: 'uuid-1',
          label: 'Mark Zuckerberg',
          isCorrect: true
        },
        {
          id: 'uuid-2',
          label: 'Bill Gates',
          isCorrect: false
        },
        {
          id: 'uuid-3',
          label: 'Steve Jobs',
          isCorrect: false
        },
        {
          id: 'uuid-4',
          label: 'Elon Musk',
          isCorrect: false
        }
      ]
    },
    {
      id: 'uuid-4',
      no: 4,
      title: 'Enter your email to get your result',
      description: 'Enter email here',
      isPage: true
    }
  ];
  let currentQuestion = questions[0];
  let activeQuestion: WaitlistQuestion | undefined;

  function handleShare() {
    console.log('Share');
  }
  function deleteQuestion(q: WaitlistQuestion) {
    if (q.isPage) return;

    openPopover[q.id] = false;
    activeQuestion = undefined;
    questions = questions.filter((question) => question.id !== q.id);
  }

  function duplicateQuestion(q: WaitlistQuestion) {
    openPopover[q.id] = false;
    activeQuestion = undefined;

    questions = [
      ...questions,
      {
        ...q,
        id: `uuid-${Math.random()}`,
        no: questions.length + 1
      }
    ];
  }
  function handleStart() {
    console.log('Start');
  }
</script>

<CourseContainer bind:courseId={data.courseId}>
  <PageNav title="Waitlist Form" overidableStyle="padding: 0 10px">
    <div slot="widget">
      <PrimaryButton label="Share" onClick={handleShare} />
    </div>
  </PageNav>

  <PageBody width="w-full px-2 lg:px-0 lg:max-w-6xl lg:w-11/12 overflow-x-auto">
    <Tabs {tabs} {currentTab} {onChange}>
      <slot:fragment slot="content">
        <!-- Content Tab -->
        <TabContent value={tabs[0].value} index={currentTab}>
          <div class="h-[70vh] flex gap-4">
            <div class="h-full w-2/6">
              <!-- Title -->
              <div class="flex justify-between pb-2">
                <p class="text-md font-bold">Quiz Content</p>
                <IconButton onClick={handleAddOptions} contained={true} size="small">
                  <Add size={16} />
                </IconButton>
              </div>

              <!-- Questions -->
              <div class="flex flex-col p-0">
                {#each questions as question}
                  <button
                    class="question-btn flex my-1 items-center gap-2 p-3 {question.id ===
                      currentQuestion.id && 'bg-gray-100 dark:bg-neutral-800'}"
                    on:click={() => (currentQuestion = question)}
                  >
                    <div
                      class="bg-gray-100 dark:bg-neutral-800 rounded-md px-2 py-1 flex items-center"
                    >
                      {#if question.isPage}
                        <WatsonHealthStackedScrolling_1 class="carbon-icon" />
                      {:else}
                        <CheckmarkOutline class="carbon-icon" />
                      {/if}
                      <span class="ml-2">{question.no}</span>
                    </div>

                    <p class="text-sm text-start w-2/3">
                      {question.title}{#if question.isRequired}
                        <span class="text-red-700 ml-2">*</span>
                      {/if}
                    </p>
                    {#if question.isPage}
                      <Tooltip triggerText="" icon={LockedIcon}>
                        <p>The welcome page and the last page cannot be deleted.</p>
                      </Tooltip>
                    {:else}
                      <div bind:this={aiButtonRef}>
                        <IconButton
                          stopPropagation={true}
                          onClick={() => {
                            openPopover[question.id] = true;
                            activeQuestion = question;
                          }}
                          buttonClassName="relative"
                          size="small"
                        >
                          <OverflowMenuVertical class="carbon-icon overflow-menu" />
                          <Popover
                            caret
                            align="right"
                            bind:open={openPopover[question.id]}
                            on:click:outside={({ detail }) => {
                              openPopover[question.id] = aiButtonRef?.contains(detail.target);
                              activeQuestion = undefined;
                            }}
                            closeOnOutsideClick={true}
                          >
                            <div>
                              <button
                                class={buttonClass}
                                on:click={(e) => {
                                  e.stopPropagation();
                                  deleteQuestion(question);
                                }}
                              >
                                <TrashCan class="carbon-icon mr-2" />
                                Delete
                              </button>
                              <button
                                class={buttonClass}
                                on:click={(e) => {
                                  e.stopPropagation();
                                  duplicateQuestion(question);
                                }}
                              >
                                <Copy class="carbon-icon mr-2" />
                                Duplicate
                              </button>
                            </div>
                          </Popover>
                        </IconButton>
                      </div>
                    {/if}
                  </button>
                {/each}
              </div>
            </div>

            <!-- Question Editor -->
            <div
              class="h-full w-2/3 bg-gray-100 dark:bg-neutral-800 flex items-center justify-center"
            >
              <div
                class="h-[500px] w-4/5 bg-white dark:bg-black rounded-md shadow-md p-2 flex items-center justify-center"
              >
                {#each questions as question, index}
                  {#if question.id === currentQuestion.id}
                    <div class="w-full text-center flex items-center flex-col">
                      {#if question.type === QUESTION_TYPE.CHECKBOX}
                        <CheckboxQuestion {question} {handleStart} />
                      {:else if question.isPage && index === 0}
                        <IntroQuestion {question} {handleStart} />
                      {:else if question.isPage && index === questions.length - 1}
                        <FinalQuestion {question} {handleStart} />
                      {:else}
                        No Question
                        <Link href="https://www.classroomio.com/">Open ClassroomIO</Link>
                      {/if}
                    </div>
                  {/if}
                {/each}
              </div>
            </div>
          </div>
        </TabContent>

        <!-- Result Tab -->
        <TabContent value={tabs[1].value} index={currentTab}>Result</TabContent>
      </slot:fragment>
    </Tabs>
  </PageBody>
</CourseContainer>
