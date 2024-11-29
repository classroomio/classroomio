<script>
  import PageHeader from '$lib/PageHeader/PageHeader.svelte';
  import { tools } from '$lib/utils/constants/tools';

  const freeTools = tools.filter((item) => item.show);
</script>

<section>
  <PageHeader>
    <!-- added bg-background to keep the background white on devices that are on darkmode -->
    <div class="bg-background text-left md:text-center md:w-2/4 px-7 md:p-0 mx-auto">
      <h1 class="text-5xl md:text-6xl font-bold">
        Explore our free <span class="text-blue-700">tools</span>
      </h1>
      <p class="my-4 md:my-8">
        Innovative tools to help you aid you example preparation, as well as making learning more
        fun for students and educator looking for engaging resources.
      </p>

      <div class="flex relative w-[90%] md:w-[50%] my-3 md:mt-10 mx-auto bg-background">
        <!-- <img
          class="w-[18%] rounded-full border hover:scale-110 transition-all hover:z-50 absolute left-0 z-0"
          src="/free-tools/waec.svg"
          alt="Waec logo"
        /> -->
        <img
          class="w-[18%] rounded-full border hover:scale-110 transition-all hover:z-50 absolute left-[55px] z-10 dark:grayscale dark:invert dark:hover:grayscale-0"
          src="/free-tools/progress-report.svg"
          alt="Progress Report"
        />
        <img
          class="w-[18%] rounded-full border hover:scale-110 transition-all hover:z-50 absolute left-[100px] z-20 dark:grayscale dark:invert dark:hover:grayscale-0"
          src="/free-tools/activity-stopwatch.svg"
          alt="Activity Stopwatch logo"
        />
        <img
          class="w-[18%] rounded-full border hover:scale-110 transition-all hover:z-50 absolute left-[150px] z-30 dark:grayscale dark:invert dark:hover:grayscale-0"
          src="/free-tools/name-picker.svg"
          alt="Name picker logo"
        />
        <img
          class="w-[18%] rounded-full border hover:scale-110 transition-all hover:z-50 absolute left-[200px] z-40 dark:grayscale dark:invert dark:hover:grayscale-0"
          src="/free-tools/tic-tac.svg"
          alt="Tic tac logo"
        />
        <img
          class="w-[18%] rounded-full border hover:scale-110 transition-all hover:z-50 absolute left-[250px] z-50 bg-white dark:bg-black dark:border-none dark:grayscale dark:hover:grayscale-0"
          src="/free-tools/pomodoro.svg"
          alt="Pomodoro Timer logo"
        />
        <!-- <img
          class="w-[18%] rounded-full border hover:scale-110 transition-all hover:z-50 absolute left-[250px] z-50"
          src="/free-tools/jamb.svg"
          alt="Jamb logo"
        /> -->
      </div>
    </div>
  </PageHeader>

  <div class="p-10 px-2 md:px-0 bg-background">
    <h1 class="text-center font-bold text-3xl">Featured Tools</h1>

    <div
      class="flex justify-evenly gap-y-8 flex-wrap w-full md:w-[70%] mt-10 mx-auto bg-background"
    >
      {#each freeTools as tool}
        <a
          href="/tools/{tool.slug}"
          class="group w-full flex md:max-w-[370px] border dark:bg-black dark:border-gray-950 rounded-md shadow-sm hover:scale-95 transition-all ease-in-out"
        >
          <img
            class="w-[30%] rounded-l-md dark:invert dark:grayscale group-hover:dark:grayscale-0"
            src={tool.src}
            alt={tool.subText}
          />
          <div class="bg-[#F5F8FE] dark:bg-black p-5 rounded-r-md w-[70%]">
            <h1 class="font-bold text-sm md:text-base">{tool.title}</h1>
            <p class="text-xs text-gray-600 dark:text-gray-200 mt-1.5">
              {tool.subText}
            </p>
          </div>
        </a>
      {/each}
    </div>
  </div>
</section>
