<script lang="ts">
  import ToolsHeader from '$lib/ToolsHeader/ToolsHeader.svelte';

  interface TodoItem {
    content: string;
    isEditing: boolean;
    time: string;
    isPaused: boolean;
  }

  let todoList: TodoItem[] = [];
  let timers: NodeJS.Timeout[] = [];
  let currentTimer: NodeJS.Timeout | null = null;
  let currentTaskIndex: number | null = null;
  let countdownDisplay: string = '00:00:00';

  function setEditing(i: number, isEditing: boolean) {
    todoList[i].isEditing = isEditing;
  }

  function deleteTodo(i: number) {
    clearInterval(timers[i]);
    timers.splice(i, 1);
    todoList.splice(i, 1);
    todoList = todoList;

    if (currentTaskIndex === i) {
      clearInterval(currentTimer);
      currentTimer = null;
      countdownDisplay = '00:00:00';
    }
  }

  function pauseAndPlay(i: number, isPaused: boolean) {
    if (currentTaskIndex !== null && currentTaskIndex !== i) {
      clearInterval(currentTimer); // Clear the current timer if it's running
      todoList[currentTaskIndex].isPaused = true; // Pause the previously selected task
    }

    if (!isPaused) {
      // If the task is not paused, start the timer
      startTimer(i);
    } else {
      // If the task is paused, clear its timer
      clearInterval(timers[i]);
      timers[i] = null;
    }

    todoList[i].isPaused = !isPaused; // Toggle the pause state for the selected task
    currentTaskIndex = isPaused ? null : i; // Update the currentTaskIndex if the task is not paused
  }

  function addTodo() {
    todoList = [...todoList, { content: '', isEditing: true, time: '0:45:30', isPaused: false }];
    timers.push(null);
  }

  function startTimer(index: number) {
    clearInterval(currentTimer);
    currentTimer = setInterval(() => {
      let totalSeconds = timeStringToSeconds(todoList[index].time);
      if (totalSeconds > 0 && todoList[index].isPaused) {
        totalSeconds--;
        todoList[index].time = secondsToTimeString(totalSeconds);
        countdownDisplay = todoList[index].time;
      } else {
        clearInterval(currentTimer);
      }
    }, 1000);
  }

  function timeStringToSeconds(time: string): number {
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  }

  function secondsToTimeString(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;
    return `${String(hours).padStart(1, '0')}:${String(minutes).padStart(2, '0')}:${String(
      seconds
    ).padStart(2, '0')}`;
  }
</script>

<svelte:head>
  <title>Promodoro Timer | ClassroomIO</title>
  <meta property="og:image" itemprop="image" content="" />
  <meta property="og:title" content="Promodoro Timer | ClassroomIO" />
  <meta
    property="og:description"
    content="Make your workday more engaging and effective with the Pomodoro timer, break work into 25-minute focused intervals called 'pomodoros', followed by 5-minute breaks"
  />

  <meta property="og:image:secure_url" itemprop="image" content="" />

  <meta name="twitter:title" content="Promodoro Timer | ClassroomIO" />
  <meta
    name="twitter:description"
    content="Make your workday more engaging and effective with the Pomodoro timer, break work into 25-minute focused intervals called 'pomodoros', followed by 5-minute breaks"
  />
  <meta name="twitter:image" content="" />
</svelte:head>

<section class="mt-[30%] px-1 md:px-0 md:mt-[5%] w-full md:w-full">
  <ToolsHeader>
    <img
      src="/free-tools/promodoro.svg"
      class="w-[15%] md:w-[5%] mx-auto border rounded-full"
      alt=""
    />
    <h1 class="text-4xl md:text-6xl font-bold text-[#040F2D] my-3">Pomodoro Timer</h1>
    <p class="text-sm mt-10 text-[#656565] font-light md:font-normal md:w-[45%] mx-auto">
      Make your workday more engaging and effective with the Pomodoro timer, break work into
      25-minute focused intervals called "pomodoros," followed by 5-minute breaks. take a longer
      break. This method keeps you energized and productive throughout the day!
    </p>
  </ToolsHeader>

  <div class="w-full h-[80vh] flex justify-between px-10 text-white text-center">
    <!-- left side -->
    <div class="w-[62%] bg-[#0D4CFF] rounded-2xl p-10 flex flex-col justify-between">
      <!-- types -->
      <div class="flex item-center justify-evenly">
        <button type="button" class="bg-[#3ADFECED] italic py-1.5 px-7 font-medium rounded-md"
          >Promodoro</button
        >
        <button type="button" class="bg-[#0233BD] italic py-1.5 px-7 font-medium rounded-md"
          >Short Break
        </button>
        <button type="button" class="bg-[#0233BD] italic py-1.5 px-7 font-medium rounded-md"
          >Long Break
        </button>
      </div>

      <!-- countdown -->
      <h1 class="text-9xl font-bold">{countdownDisplay}</h1>

      <!-- controls -->
      <div class="flex items-center justify-center gap-7">
        <button type="button"
          ><img
            src="/free-tools/promodoro/restart-icon.svg"
            alt="Restart Icon"
            class="w-7"
          /></button
        >
        <button
          type="button"
          class="bg-white text-[#0542CC] text-base font-bold uppercase py-3 px-14 rounded-md"
          >Start</button
        >
        <button type="button"
          ><img
            src="/free-tools/promodoro/timer-play-icon.svg"
            alt="Play Icon"
            class="w-7"
          /></button
        >
      </div>
    </div>

    <!-- right side -->
    <div class="w-[36%] relative">
      <h1 class="bg-[#040F2D] uppercase text-xl font-bold py-3">to do list</h1>

      <div class="border overflow-hidden">
        <div class="overflow-y-auto max-h-[60vh]">
          {#each todoList as todo, i}
            <div class="border text-black p-5">
              {#if todo.isEditing}
                <p class="text-xs text-left text-[#656565] font-semibold">Promodoro name</p>
                <input
                  type="text"
                  bind:value={todo.content}
                  class="bg-[#F1F2F4] border-[#EAEAEA] w-full border mt-2 px-3 py-2 text-base font-semibold outline-none"
                />
                <div class="flex justify-end items-center gap-5 mt-5">
                  <button
                    type="button"
                    on:click={() => deleteTodo(i)}
                    class="rounded-sm py-2 px-5 text-xs font-semibold bg-[#F7F7F7]">Discard</button
                  >
                  <button
                    type="button"
                    on:click={() => setEditing(i, false)}
                    class="rounded-sm py-2 px-5 text-xs font-semibold bg-[#0D4CFF] text-white"
                    >Save</button
                  >
                </div>
              {:else}
                <div class="">
                  <div class="flex justify-between">
                    <p class="text-sm font-medium">{todo.content}</p>

                    <!-- pen and menu icon -->
                    <div class="flex justify-between w-[15%]">
                      <button type="button" on:click={() => setEditing(i, true)}
                        ><img
                          src="/free-tools/promodoro/pen-icon.svg"
                          alt="Pen icon"
                          class="w-5"
                        /></button
                      >
                      <button type="button"
                        ><img
                          src="/free-tools/promodoro/menu-icon.svg"
                          alt="Menu icon"
                          class="w-5"
                        /></button
                      >
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
                      on:click={() => pauseAndPlay(i, todo.isPaused)}
                      class="{todo.isPaused
                        ? 'bg-[#0D4CFF] text-white'
                        : ' text-[#0D4CFF]'} flex items-center border-2 border-[#0D4CFF] justify-center gap-2 py-1.5 px-4 rounded-[4px] text-xs font-medium uppercase"
                    >
                      {#if todo.isPaused}
                        <img src="/free-tools/promodoro/pause-icon.svg" alt="Pause icon" />
                        pause task
                      {:else}
                        <img src="/free-tools/promodoro/list-play-icon.svg" alt="Play icon" />
                        play task
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
          class="bg-[#1D4ED8] rounded-md text-center mt-10 py-3 w-full flex justify-center items-center gap-3"
          >Add new item
          <img src="/free-tools/promodoro/add-icon.svg" alt="Add icon" class="w-3" />
        </button>
      </div>
    </div>
  </div>
</section>
