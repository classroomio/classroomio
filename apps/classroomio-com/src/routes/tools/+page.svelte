<script>
  import PageHeader from '$lib/PageHeader/PageHeader.svelte';

  const tools = [
    {
      src: '/free-tools/name-picker.svg',
      title: 'Random Name Picker',
      subText: 'Effortlessly choose names for class participation or group activities',
      slug: 'name-picker',
      show: true
    },
    {
      src: '/free-tools/activity-stopwatch.svg',
      title: 'Activity Stopwatch',
      subText:
        'Stay on track and enhance productivity with our customizable stopwatch for timed tasks, quizzes, and study sessions',
      slug: 'activity-stopwatch',
      show: true
    },
    {
      src: '/free-tools/tic-tac.svg',
      title: 'Tic tac toe game',
      subText:
        "More than just a game; it's an educational tool that teaches pattern recognition, and decision-making.",
      slug: 'tic-tac-toe',
      show: true
    },
    {
      src: '/free-tools/question-of-the-day.svg',
      title: 'Question of the day ',
      subText:
        "Find thought-provoking 'Question of the Day' to spark discussions and promote critical thinking",
      slug: 'question-of-the-day',
      show: true
    },
    {
      src: '/free-tools/waec.svg',
      title: 'WAEC Practice tool',
      subText: 'Ace your WAEC exams with comprehensive study materials, past questions',
      slug: 'waec',
      show: false
    },
    {
      src: '/free-tools/jamb.svg',
      title: 'JAMB Practice tool',
      subText:
        'Prepare for JAMB with past questions and instant feedback for effective exam readiness',
      slug: 'jamb',
      show: false
    }
  ].filter((item) => item.show);
</script>

<section>
  <PageHeader>
    <div class="text-left md:text-center md:w-2/4 px-7 md:p-0 mx-auto">
      <h1 class="text-5xl md:text-6xl font-bold">
        Explore our free <span class="text-blue-700">tools</span>
      </h1>
      <p class="my-4 md:my-8">
        Innovative tools to help you aid you example preparation, as well as making learning more
        fun for students and educator looking for engaging resources.
      </p>

      <div class="flex relative md:w-[50%] my-3 md:mt-10 mx-auto">
        <!-- <img
          class="w-[18%] rounded-full border hover:scale-110 transition-all hover:z-50 absolute left-0 z-0"
          src="/free-tools/waec.svg"
          alt="Waec logo"
        /> -->
        <img
          class="w-[18%] rounded-full border hover:scale-110 transition-all hover:z-50 absolute left-[50px] z-10"
          src="/free-tools/question-of-the-day.svg"
          alt="Question of the day logo"
        />
        <img
          class="w-[18%] rounded-full border hover:scale-110 transition-all hover:z-50 absolute left-[100px] z-20"
          src="/free-tools/activity-stopwatch.svg"
          alt="Activity Stopwatch logo"
        />
        <img
          class="w-[18%] rounded-full border hover:scale-110 transition-all hover:z-50 absolute left-[150px] z-30"
          src="/free-tools/name-picker.svg"
          alt="Name picker logo"
        />
        <img
          class="w-[18%] rounded-full border hover:scale-110 transition-all hover:z-50 absolute left-[200px] z-40"
          src="/free-tools/tic-tac.svg"
          alt="Tic tac logo"
        />
        <!-- <img
          class="w-[18%] rounded-full border hover:scale-110 transition-all hover:z-50 absolute left-[250px] z-50"
          src="/free-tools/jamb.svg"
          alt="Jamb logo"
        /> -->
      </div>
    </div>
  </PageHeader>

  <div class="p-10 px-2 md:px-0">
    <h1 class="text-center font-bold text-3xl">Featured Tools</h1>

    <div class="flex justify-evenly gap-y-8 flex-wrap w-full md:w-[70%] mt-10 mx-auto">
      {#each tools as tool}
        <a
          href="/tools/{tool.slug}"
          class="w-full flex md:max-w-[370px] border rounded-md shadow-sm hover:scale-95 transition-all ease-in-out"
        >
          <img class="w-[30%] rounded-l-md" src={tool.src} alt="" />
          <div class="bg-[#F5F8FE] p-5 rounded-r-md">
            <h1 class="font-bold text-sm md:text-base">{tool.title}</h1>
            <p class="text-xs text-gray-600 mt-1.5">
              {tool.subText}
            </p>
          </div>
        </a>
      {/each}
    </div>
  </div>
</section>
