<script>
  import { PageHeader } from '$lib/components';
  import { tools } from '$lib/utils/constants/tools';

  const freeTools = tools.filter((item) => item.show);
</script>

<section>
  <PageHeader>
    <!-- added bg-white to keep the background white on devices that are on darkmode -->
    <div class="mx-auto bg-white px-7 text-left md:w-2/4 md:p-0 md:text-center">
      <h1 class="text-3xl md:text-5xl">
        Explore our free <span class="text-blue-700">tools</span>
      </h1>
      <p class="my-4 md:my-8">
        Innovative tools to help you aid you example preparation, as well as making learning more fun for students and
        educator looking for engaging resources.
      </p>

      <div class="relative mx-auto my-3 flex w-[90%] bg-white md:mt-10 md:w-[50%]">
        <!-- <img
          class="w-[18%] rounded-full border hover:scale-110 transition-all hover:z-50 absolute left-0 z-0"
          src="/free-tools/waec.svg"
          alt="Waec logo"
        /> -->
        <img
          class="absolute left-[55px] z-10 w-[18%] rounded-full border transition-all hover:z-50 hover:scale-110"
          src="/free-tools/progress-report.svg"
          alt="Progress Report"
        />
        <img
          class="absolute left-[100px] z-20 w-[18%] rounded-full border transition-all hover:z-50 hover:scale-110"
          src="/free-tools/activity-stopwatch.svg"
          alt="Activity Stopwatch logo"
        />
        <img
          class="absolute left-[150px] z-30 w-[18%] rounded-full border transition-all hover:z-50 hover:scale-110"
          src="/free-tools/name-picker.svg"
          alt="Name picker logo"
        />
        <img
          class="absolute left-[200px] z-40 w-[18%] rounded-full border transition-all hover:z-50 hover:scale-110"
          src="/free-tools/tic-tac.svg"
          alt="Tic tac logo"
        />
        <img
          class="absolute left-[250px] z-50 w-[18%] rounded-full border bg-white transition-all hover:z-50 hover:scale-110"
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

  <div class="bg-white p-10 px-2 md:px-0">
    <h1 class="text-center text-2xl">Featured Tools</h1>

    <div class="mx-auto mt-10 flex w-full flex-wrap justify-evenly gap-y-8 bg-white md:w-[70%]">
      {#each freeTools as tool}
        <a
          href="/tools/{tool.slug}"
          class="flex w-full rounded-md border shadow-sm transition-all ease-in-out hover:scale-95 md:max-w-[370px]"
        >
          <img class="w-[30%] rounded-l-md" src={tool.src} alt="" />
          <div class="w-[70%] rounded-r-md bg-[#F5F8FE] p-5">
            <h1 class="text-sm md:text-base">{tool.title}</h1>
            <p class="mt-1.5 text-xs text-gray-600">
              {tool.subText}
            </p>
          </div>
        </a>
      {/each}
    </div>
  </div>
</section>
