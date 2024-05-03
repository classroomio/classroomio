<script>
  import PageHeader from '$lib/PageHeader/PageHeader.svelte';

  const tools = [
    {
      src: '/free-tools/name-picker.svg',
      title: 'Random Name Picker',
      subText: 'Effortlessly choose names for class participation or group activities'
    },
    {
      src: '/free-tools/activity-timer.svg',
      title: 'Timed Activity Timer',
      subText:
        'Stay on track and enhance productivity with our customizable timer for timed tasks, quizzes, and study sessions'
    },
    {
      src: '/free-tools/question-of-the-day.svg',
      title: 'Question of the day ',
      subText:
        "Find thought-provoking 'Question of the Day' to spark discussions and promote critical thinking"
    },
    {
      src: '/free-tools/waec.svg',
      title: 'WAEC Practice tool',
      subText: 'Ace your WAEC exams with comprehensive study materials, past questions'
    },
    {
      src: '/free-tools/jamb.svg',
      title: 'JAMB Practice tool',
      subText:
        'Prepare for JAMB with past questions and instant feedback for effective exam readiness'
    },
    {
      src: '/free-tools/tic-tac.svg',
      title: 'Tic tac toe game',
      subText:
        "More than just a game; it's an educational ool that teaches pattern recognition, and decision-making."
    }
  ];
</script>

<svelte:head>
  <title>Free Tools | ClassroomIO</title>
  <meta property="og:image" itemprop="image" content="" />
  <meta property="og:title" content="Free Tools" />
  <meta property="og:description" content="On ClassroomIO you have access to free tools." />

  <meta property="og:image:secure_url" itemprop="image" content="" />

  <meta name="twitter:title" content="Free Tools" />
  <meta name="twitter:description" content="On ClassroomIO you have access to free tools." />
  <meta name="twitter:image" content="" />
</svelte:head>

<section>
  <PageHeader>
    <div class="text-left lg:text-center lg:w-2/4 px-7 lg:p-0 mx-auto">
      <h1 class="text-5xl lg:text-6xl font-bold">
        Explore our free <span class="text-[#1D4ED8]">tools</span>
      </h1>
      <p class="my-4 lg:my-8">
        Innovative tools to help you aid you example preparation, as well as making learning more
        fun for students and educator looking for engaging resources.
      </p>

      <div class="flex relative lg:w-[50%] my-3 lg:mt-10 mx-auto">
        <img
          class="w-[18%] rounded-full border hover:scale-110 transition-all hover:z-50 absolute left-0 z-0"
          src="/free-tools/waec.svg"
          alt=""
        />
        <img
          class="w-[18%] rounded-full border hover:scale-110 transition-all hover:z-50 absolute left-[50px] z-10"
          src="/free-tools/question-of-the-day.svg"
          alt=""
        />
        <img
          class="w-[18%] rounded-full border hover:scale-110 transition-all hover:z-50 absolute left-[100px] z-20"
          src="/free-tools/activity-timer.svg"
          alt=""
        />
        <img
          class="w-[18%] rounded-full border hover:scale-110 transition-all hover:z-50 absolute left-[150px] z-30"
          src="/free-tools/name-picker.svg"
          alt=""
        />
        <img
          class="w-[18%] rounded-full border hover:scale-110 transition-all hover:z-50 absolute left-[200px] z-40"
          src="/free-tools/tic-tac.svg"
          alt=""
        />
        <img
          class="w-[18%] rounded-full border hover:scale-110 transition-all hover:z-50 absolute left-[250px] z-50"
          src="/free-tools/jamb.svg"
          alt=""
        />
      </div>
    </div>
  </PageHeader>

  <div class="p-10 lg:px-0">
    <h1 class="text-center font-bold text-3xl">Featured Tools</h1>

    <div class="flex justify-between gap-y-8 flex-wrap w-full lg:w-[70%] mt-10 mx-auto">
      {#each tools as tool}
        <figure class="w-full flex lg:max-w-[370px] border rounded-md shadow-sm">
          <img class="w-[30%] rounded-l-md" src={tool.src} alt="" />
          <figcaption class="bg-[#F5F8FE] p-5 rounded-r-md">
            <h1 class="font-bold text-sm lg:text-base">{tool.title}</h1>
            <p class="text-xs text-gray-600 mt-1.5">
              {tool.subText}
            </p>
          </figcaption>
        </figure>
      {/each}
    </div>
  </div>
</section>
