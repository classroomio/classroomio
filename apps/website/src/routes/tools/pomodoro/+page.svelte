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

<section class=" w-full bg-white px-1 md:w-full md:px-0">
  <ToolsHeader>
    <img src="/free-tools/pomodoro.svg" class="mx-auto w-[15%] rounded-full border md:w-[5%]" alt="" />
    <h1 class="my-3 text-4xl font-bold text-[#040F2D] md:text-6xl">Pomodoro Timer</h1>
    <p class="mx-auto mt-10 text-sm font-light text-[#656565] md:w-[45%] md:font-normal">
      Make your workday more engaging and effective with the Pomodoro timer, break work into 25-minute focused intervals
      called "pomodoros," followed by 5-minute breaks. take a longer break.
    </p>
  </ToolsHeader>

  <div
    class="body my-10 flex w-full flex-col justify-evenly gap-y-10 px-5 text-center text-white md:h-[60vh] md:flex-row md:px-10"
  >
    <!-- left side -->
    <div
      class="flex w-full flex-col justify-between gap-y-16 rounded-lg bg-[#0D4CFF] px-5 py-7 md:w-[50%] md:gap-y-0 md:rounded-2xl md:p-10"
    >
      <!-- types -->
      <div class="item-center flex justify-evenly">
        <button
          type="button"
          on:click={() => setTimerState('pomodoro')}
          class:bg-[#3ADFECED]={timerState === 'pomodoro'}
          class:bg-[#0233BD]={timerState !== 'pomodoro'}
          class="w-[25%] rounded-md py-1.5 text-xs italic transition-all duration-500 hover:bg-[#3ADFECED] md:py-2 md:text-sm md:font-medium"
          >Pomodoro</button
        >
        <button
          type="button"
          on:click={() => setTimerState('long-break')}
          class:bg-[#3ADFECED]={timerState === 'long-break'}
          class:bg-[#0233BD]={timerState !== 'long-break'}
          class="w-[25%] rounded-md py-1.5 text-xs italic transition-all duration-500 hover:bg-[#3ADFECED] md:py-2 md:text-sm md:font-medium"
          >Short Break
        </button>
        <button
          type="button"
          on:click={() => setTimerState('short-break')}
          class:bg-[#3ADFECED]={timerState === 'short-break'}
          class:bg-[#0233BD]={timerState !== 'short-break'}
          class="w-[25%] rounded-md py-1.5 text-xs italic transition-all duration-500 hover:bg-[#3ADFECED] md:py-2 md:text-sm md:font-medium"
          >Long Break
        </button>
      </div>

      <!-- countdown -->
      <h1 class="text-7xl font-bold md:text-9xl">{countdownDisplay}</h1>

      <!-- controls -->
      <div class="flex items-center justify-center gap-7">
        <!-- reset -->
        <button type="button" on:click={resetCountdown}>
          <img
            src="/free-tools/pomodoro/restart-icon.svg"
            alt="Restart Icon"
            class="w-7 transition-all duration-300 hover:scale-110"
          />
        </button>

        <!-- start (i intentionally disabled this button once the user clicks start so they can use the pause button to actually pause the countdown) -->
        <button
          type="button"
          on:click={isPaused ? startCountdown : pauseCountdown}
          class="rounded-md border bg-white px-14 py-3 text-base font-bold uppercase text-[#0542CC] transition-all duration-300 hover:border hover:border-white hover:bg-transparent hover:text-white"
        >
          {isPaused ? 'Start' : 'Pause'}
        </button>

        <!-- next -->
        <button type="button" on:click={nextTimerState}>
          <img
            src="/free-tools/pomodoro/timer-play-icon.svg"
            alt="Play Icon"
            class="w-7 transition-all duration-300 hover:scale-110"
          />
        </button>
      </div>
    </div>

    <!-- right side -->
    <div class="relative w-full md:w-[36%]">
      <h1
        class="bg-[#040F2D] py-4 text-xl font-bold uppercase"
        style="clip-path: polygon(0 0, 100% 1%, 100% 65%, 0% 100%);"
      >
        To do list
      </h1>

      <div class="overflow-hidden">
        <!-- todos -->
        <div class="mt-3 max-h-[40vh] overflow-y-auto md:max-h-[50vh]">
          {#each todoList as todo, i}
            <div class="border p-5 text-black">
              {#if todo.isEditing}
                <form on:submit|preventDefault={() => setEditing(i, false)}>
                  <p class="text-left text-xs font-semibold text-[#656565]">Pomodoro name</p>
                  <input
                    type="text"
                    bind:this={addInput}
                    bind:value={todo.content}
                    class="mt-2 w-full border border-[#EAEAEA] bg-[#F1F2F4] px-3 py-2 text-base outline-none"
                  />
                  <div class="mt-5 flex items-center justify-end gap-5">
                    <button
                      type="button"
                      on:click={() => deleteTodo(i)}
                      class="rounded-sm bg-[#F7F7F7] px-5 py-2 text-xs font-semibold">Discard</button
                    >
                    <button type="submit" class="rounded-sm bg-[#0D4CFF] px-5 py-2 text-xs font-semibold text-white"
                      >Save</button
                    >
                  </div>
                </form>
              {:else}
                <div class="">
                  <div class="flex justify-between">
                    <p class="text-sm font-medium">{todo.content}</p>

                    <!-- pen and menu icon -->
                    <div class="relative flex w-[15%] justify-between">
                      <button type="button" on:click={() => setEditing(i, true)}>
                        <img src="/free-tools/pomodoro/pen-icon.svg" alt="Pen icon" class="w-5" />
                      </button>

                      <button type="button" on:click={() => (todo.isVisible = !todo.isVisible)}>
                        <img src="/free-tools/pomodoro/menu-icon.svg" alt="Menu icon" class="w-5" />
                      </button>

                      {#if todo.isVisible}
                        <ul
                          class="absolute -right-3 top-6 z-40 w-[8rem] rounded-[5px] border bg-white text-xs shadow-md"
                        >
                          <button
                            type="button"
                            on:click={() => markTodoAsDone(i)}
                            class="w-full px-5 py-3 text-left font-medium"
                          >
                            Mark as done
                          </button>
                          <button
                            type="button"
                            on:click={() => deleteTodo(i)}
                            class="w-full rounded-b-[5px] bg-red-600 px-5 py-3 text-left font-medium text-white"
                          >
                            Delete
                          </button>
                        </ul>
                      {/if}
                    </div>
                  </div>

                  <div class="mt-10 flex items-center justify-between">
                    <p class="rounded-[3px] bg-[#EAEAEA] px-1.5 py-0.5 text-xs font-medium text-[#656565]">
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
                        ? 'border-none bg-[#00D06C] text-white'
                        : todo.isPaused
                          ? 'border-[#0D4CFF] bg-white text-[#0D4CFF]'
                          : 'border-none bg-[#0D4CFF] text-white'} 
                          
                          flex items-center justify-center gap-2 rounded-[4px] border-2 px-4 py-1.5 text-xs font-bold uppercase"
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
          class="mt-10 flex w-full items-center justify-center gap-3 rounded-md bg-[#1D4ED8] py-3 text-center font-medium"
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
