<script lang="ts">
  import { onMount } from 'svelte';
  import ToolsHeader from '$lib/ToolsHeader/ToolsHeader.svelte';

  interface TodoItem {
    id: number;
    content: string;
    time: string;
    isPaused: boolean;
    isEditing: boolean;
    isDone: boolean;
    isVisible: boolean;
  }

  let addInput: HTMLInputElement;
  let buzzSound: HTMLAudioElement;
  let todoList: TodoItem[] = [];

  let countdownTime: number = 25 * 60;
  let countdownDisplay: string = '25:00';
  let timerState: string = 'pomodoro';

  let isPaused: boolean = true;
  let timerInterval: any = null;
  let isVisible: boolean = false;

  const timerSequence = ['pomodoro', 'long-break', 'short-break'];

  function saveTodoList() {
    localStorage.setItem('todoList', JSON.stringify(todoList));
  }

  function loadTodoList() {
    const storedTodoList = localStorage.getItem('todoList');
    if (storedTodoList) {
      todoList = JSON.parse(storedTodoList);
    }
  }

  function setEditing(i: number, isEditing: boolean) {
    todoList[i].isEditing = isEditing;
    saveTodoList();
  }

  function deleteTodo(i: number) {
    todoList.splice(i, 1);
    todoList = todoList;
    isVisible = false;
    saveTodoList();
  }

  function markTodoAsDone(i: number) {
    todoList[i].isDone = true;
    todoList = [...todoList];
    todoList[i].isVisible = false;
    saveTodoList();
  }

  function addTodo() {
    todoList = [
      ...todoList,
      {
        id: new Date().getMilliseconds(),
        content: '',
        isEditing: true,
        time: '25:00',
        isPaused: true,
        isDone: false,
        isVisible: false
      }
    ];

    setTimeout(() => {
      addInput.focus();
    }, 50);

    saveTodoList();
  }

  function startCountdown() {
    if (!isPaused) {
      return;
    }

    isPaused = false;

    timerInterval = setInterval(() => {
      if (countdownTime > 0) {
        countdownTime--;
        updateCountdownDisplay();
      } else {
        clearInterval(timerInterval);
        countdownDisplay = '00:00';
        buzzSound.play();
      }
    }, 1000);
  }

  function pauseCountdown() {
    if (isPaused) {
      return;
    }

    isPaused = true;
    clearInterval(timerInterval);
  }

  function resetCountdown() {
    clearInterval(timerInterval);

    switch (timerState) {
      case 'pomodoro':
        countdownTime = 25 * 60;
        break;
      case 'short-break':
        countdownTime = 15 * 60;
        break;
      case 'long-break':
        countdownTime = 5 * 60;
        break;
    }

    isPaused = true;

    updateCountdownDisplay();
  }

  function nextTimerState() {
    const currentIndex = timerSequence.indexOf(timerState);
    const nextIndex = (currentIndex + 1) % timerSequence.length;
    setTimerState(timerSequence[nextIndex]);
  }

  function updateCountdownDisplay() {
    const minutes = Math.floor(countdownTime / 60);
    const seconds = countdownTime % 60;
    countdownDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  function setTimerState(state: string) {
    timerState = state;
    resetCountdown();
  }

  onMount(() => {
    buzzSound = new Audio('https://assets.cdn.clsrio.com/beeping-sound.mp3');
    loadTodoList();
  });
</script>

<svelte:head>
  <title>Pomodoro Timer | ClassroomIO</title>
  <meta property="og:image" itemprop="image" content="" />
  <meta property="og:title" content="Pomodoro Timer | ClassroomIO" />
  <meta
    property="og:description"
    content="Make your workday more engaging and effective with the Pomodoro timer, break work into 25-minute focused intervals called 'pomodoros', followed by 5-minute breaks"
  />

  <meta property="og:image:secure_url" itemprop="image" content="" />

  <meta name="twitter:title" content="Pomodoro Timer | ClassroomIO" />
  <meta
    name="twitter:description"
    content="Make your workday more engaging and effective with the Pomodoro timer, break work into 25-minute focused intervals called 'pomodoros', followed by 5-minute breaks"
  />
  <meta name="twitter:image" content="" />
</svelte:head>

<section class="mt-[10%] md:mt-16 px-1 md:px-0 w-full md:w-full">
  <ToolsHeader>
    <img
      src="/free-tools/pomodoro.svg"
      class="w-[15%] md:w-[5%] mx-auto border rounded-full"
      alt=""
    />
    <h1 class="text-4xl md:text-6xl font-bold text-[#040F2D] my-3">Pomodoro Timer</h1>
    <p class="text-sm mt-10 text-[#656565] font-light md:font-normal md:w-[45%] mx-auto">
      Make your workday more engaging and effective with the Pomodoro timer, break work into
      25-minute focused intervals called "pomodoros," followed by 5-minute breaks. take a longer
      break.
    </p>
  </ToolsHeader>

  <div
    class="body w-full md:h-[60vh] flex flex-col gap-y-10 md:flex-row justify-evenly px-5 md:px-10 my-10 text-white text-center"
  >
    <!-- left side -->
    <div
      class="w-full md:w-[50%] bg-[#0D4CFF] rounded-lg md:rounded-2xl py-7 px-5 md:p-10 flex flex-col gap-y-16 md:gap-y-0 justify-between"
    >
      <!-- types -->
      <div class="flex item-center justify-evenly">
        <button
          type="button"
          on:click={() => setTimerState('pomodoro')}
          class:bg-[#3ADFECED]={timerState === 'pomodoro'}
          class:bg-[#0233BD]={timerState !== 'pomodoro'}
          class="transition-all duration-500 italic py-1.5 md:py-2 w-[25%] text-xs md:text-sm md:font-medium rounded-md hover:bg-[#3ADFECED]"
          >Pomodoro</button
        >
        <button
          type="button"
          on:click={() => setTimerState('long-break')}
          class:bg-[#3ADFECED]={timerState === 'long-break'}
          class:bg-[#0233BD]={timerState !== 'long-break'}
          class="transition-all duration-500 italic py-1.5 md:py-2 w-[25%] text-xs md:text-sm md:font-medium rounded-md hover:bg-[#3ADFECED]"
          >Short Break
        </button>
        <button
          type="button"
          on:click={() => setTimerState('short-break')}
          class:bg-[#3ADFECED]={timerState === 'short-break'}
          class:bg-[#0233BD]={timerState !== 'short-break'}
          class="transition-all duration-500 italic py-1.5 md:py-2 w-[25%] text-xs md:text-sm md:font-medium rounded-md hover:bg-[#3ADFECED]"
          >Long Break
        </button>
      </div>

      <!-- countdown -->
      <h1 class="text-7xl md:text-9xl font-bold">{countdownDisplay}</h1>

      <!-- controls -->
      <div class="flex items-center justify-center gap-7">
        <!-- reset -->
        <button type="button" on:click={resetCountdown}>
          <img
            src="/free-tools/pomodoro/restart-icon.svg"
            alt="Restart Icon"
            class="w-7 hover:scale-110 transition-all duration-300"
          />
        </button>

        <!-- start (i intentionally disabled this button once the user clicks start so they can use the pause button to actually pause the countdown) -->
        <button
          type="button"
          on:click={isPaused ? startCountdown : pauseCountdown}
          class="bg-white text-[#0542CC] border text-base font-bold uppercase py-3 px-14 rounded-md hover:bg-transparent hover:text-white hover:border-white hover:border transition-all duration-300"
        >
          {isPaused ? 'Start' : 'Pause'}
        </button>

        <!-- next -->
        <button type="button" on:click={nextTimerState}>
          <img
            src="/free-tools/pomodoro/timer-play-icon.svg"
            alt="Play Icon"
            class="w-7 hover:scale-110 transition-all duration-300"
          />
        </button>
      </div>
    </div>

    <!-- right side -->
    <div class="w-full md:w-[36%] relative">
      <h1
        class="bg-[#040F2D] uppercase text-xl font-bold py-4"
        style="clip-path: polygon(0 0, 100% 1%, 100% 65%, 0% 100%);"
      >
        To do list
      </h1>

      <div class="overflow-hidden">
        <!-- todos -->
        <div class="overflow-y-auto mt-3 max-h-[40vh] md:max-h-[50vh]">
          {#each todoList as todo, i}
            <div class="border text-black p-5">
              {#if todo.isEditing}
                <form on:submit|preventDefault={() => setEditing(i, false)}>
                  <p class="text-xs text-left text-[#656565] font-semibold">Pomodoro name</p>
                  <input
                    type="text"
                    bind:this={addInput}
                    bind:value={todo.content}
                    class="bg-[#F1F2F4] border-[#EAEAEA] w-full border mt-2 px-3 py-2 text-base outline-none"
                  />
                  <div class="flex justify-end items-center gap-5 mt-5">
                    <button
                      type="button"
                      on:click={() => deleteTodo(i)}
                      class="rounded-sm py-2 px-5 text-xs font-semibold bg-[#F7F7F7]"
                      >Discard</button
                    >
                    <button
                      type="submit"
                      class="rounded-sm py-2 px-5 text-xs font-semibold bg-[#0D4CFF] text-white"
                      >Save</button
                    >
                  </div>
                </form>
              {:else}
                <div class="">
                  <div class="flex justify-between">
                    <p class="text-sm font-medium">{todo.content}</p>

                    <!-- pen and menu icon -->
                    <div class="relative flex justify-between w-[15%]">
                      <button type="button" on:click={() => setEditing(i, true)}>
                        <img src="/free-tools/pomodoro/pen-icon.svg" alt="Pen icon" class="w-5" />
                      </button>

                      <button type="button" on:click={() => (todo.isVisible = !todo.isVisible)}>
                        <img src="/free-tools/pomodoro/menu-icon.svg" alt="Menu icon" class="w-5" />
                      </button>

                      {#if todo.isVisible}
                        <ul
                          class="z-40 absolute top-6 -right-3 text-xs w-[8rem] bg-white border shadow-md rounded-[5px]"
                        >
                          <button
                            type="button"
                            on:click={() => markTodoAsDone(i)}
                            class="w-full font-medium text-left py-3 px-5"
                          >
                            Mark as done
                          </button>
                          <button
                            type="button"
                            on:click={() => deleteTodo(i)}
                            class="w-full font-medium text-left py-3 px-5 bg-red-600 text-white rounded-b-[5px]"
                          >
                            Delete
                          </button>
                        </ul>
                      {/if}
                    </div>
                  </div>

                  <div class="flex justify-between items-center mt-10">
                    <p
                      class="rounded-[3px] text-xs font-medium text-[#656565] bg-[#EAEAEA] py-0.5 px-1.5"
                    >
                      {todo.time}
                    </p>

                    <button
                      type="button"
                      on:click={() => {
                        if (todo.isPaused) {
                          startCountdown();
                        } else {
                          pauseCountdown();
                        }

                        todo.isPaused = !todo.isPaused;
                      }}
                      class="{todo.isDone
                        ? 'bg-[#00D06C] border-none text-white'
                        : todo.isPaused
                          ? 'bg-white text-[#0D4CFF] border-[#0D4CFF]'
                          : 'bg-[#0D4CFF] text-white border-none'} 
                          
                          flex items-center border-2 justify-center gap-2 py-1.5 px-4 rounded-[4px] text-xs font-bold uppercase"
                    >
                      {#if todo.isDone}
                        <img src="/free-tools/pomodoro/done-icon.svg" alt="Done icon" />
                        done
                      {:else if todo.isPaused}
                        <img src="/free-tools/pomodoro/list-play-icon.svg" alt="Play icon" />
                        play task
                      {:else}
                        <img src="/free-tools/pomodoro/pause-icon.svg" alt="Pause icon" />
                        pause task
                      {/if}
                    </button>
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        </div>

        <!-- todo button -->
        <button
          type="button"
          on:click={addTodo}
          class="bg-[#1D4ED8] rounded-md text-center font-medium mt-10 py-3 w-full flex justify-center items-center gap-3"
        >
          Add new item
          <img src="/free-tools/pomodoro/add-icon.svg" alt="Add icon" class="w-3" />
        </button>
      </div>
    </div>
  </div>
</section>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');

  .body {
    font-family: 'Inter', sans-serif;
  }
</style>
