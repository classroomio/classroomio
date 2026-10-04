<script>
  import { PageHeader } from '$lib/components';
  import { tools } from '$lib/utils/constants/tools';

  const freeTools = tools.filter((item) => item.show);
</script>

<section>
  <PageHeader>
    <div class="max-w-lede mx-auto bg-white px-6 text-left md:px-10 md:text-center">
      <h1 class="text-display text-balance">
        Explore our free <span class="text-blue-700">tools</span>
      </h1>
      <p class="text-lead mt-6 text-pretty md:mt-8">
        Innovative tools to help you aid you example preparation, as well as making learning more fun for students and
        educator looking for engaging resources.
      </p>

      <div class="relative mx-auto my-3 flex w-[90%] bg-white md:mt-10 md:w-[50%]">
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
      </div>
    </div>
  </PageHeader>

  <div class="bg-white px-6 py-20 md:px-10 md:py-28">
    <h2 class="text-h3 text-center text-balance">Featured Tools</h2>

    <div class="max-w-content mx-auto mt-12 grid w-full gap-6 bg-white md:grid-cols-2 lg:grid-cols-3">
      {#each freeTools as tool}
        <a
          href="/tools/{tool.slug}"
          class="group flex w-full overflow-hidden rounded-xl border border-gray-200 transition-colors"
        >
          <img class="w-[30%] object-cover" src={tool.src} alt="" />
          <div class="w-[70%] p-5">
            <h3 class="text-card-title font-medium transition-colors">{tool.title}</h3>
            <p class="mt-1.5 text-sm leading-relaxed text-gray-600">
              {tool.subText}
            </p>
          </div>
        </a>
      {/each}
    </div>
  </div>
</section>
