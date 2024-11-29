<script>
  import { fade } from 'svelte/transition';
  import Checkmark from 'carbon-icons-svelte/lib/Checkmark.svelte';
  import PLANS from 'shared/src/plans/data.json';
  import PageSignupCTA from '$lib/PageSignupCTA/index.svelte';
  import PageHeader from '$lib/PageHeader/PageHeader.svelte';

  let isYearlyPlan = false;

  function toggleIsYearlyPlan() {
    isYearlyPlan = !isYearlyPlan;
  }
</script>

<svelte:head>
  <title>Pricing | ClassroomIO</title>
</svelte:head>

<section class="dark:bg-gray-900">
  <PageHeader className="flex flex-col items-center justify-center text-center">
    <h1
      class="mx-auto text-4xl md:text-7xl lg:text-6xl font-bold text-slate-900 flex flex-col items-center dark:text-slate-100"
    >
      <span>There is room for</span>
      <span class="text-blue-700 dark:text-blue-400 relative">Everyone.</span>
    </h1>
    <p class="w-[90%] md:w-[60%] text-center font-normal text-lg text-slate-700 dark:text-slate-300 mt-10 lg:mt-7">
      You get a customizable LMS, AI integration for productive educators and many more...
    </p>
    <div class="relative mt-10 flex items-center rounded-full border-2 border-blue-700 dark:border-blue-500 p-1 lg:scale-100">
      <button
        class="rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        class:bg-blue-700={!isYearlyPlan}
        class:text-white={!isYearlyPlan}
        class:bg-transparent={isYearlyPlan}
        class:text-slate-700={isYearlyPlan}
        class:dark:text-slate-300={isYearlyPlan}
        on:click={toggleIsYearlyPlan}
      >
        Monthly
      </button>
      <button
        class="rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        class:bg-blue-700={isYearlyPlan}
        class:text-white={isYearlyPlan}
        class:bg-transparent={!isYearlyPlan}
        class:text-slate-700={!isYearlyPlan}
        class:dark:text-slate-300={!isYearlyPlan}
        on:click={toggleIsYearlyPlan}
      >
        Annually
      </button>
      <div
        class="absolute right-[-40%] top-[-85%] scale-[90%] rounded-full bg-green-600 px-3.5 py-1.5 text-xs text-white lg:right-[-43%] lg:top-[-75%] lg:scale-100"
      >
        Save 2 months
      </div>
    </div>

    <script
      src="https://widget.senja.io/widget/b43ac234-427e-4d6f-8c23-633208154e54/platform.js"
      type="text/javascript"
      async
    ></script>
    <div
      class="senja-embed mt-5"
      data-id="b43ac234-427e-4d6f-8c23-633208154e54"
      data-mode="shadow"
      data-lazyload="false"
      style="display: block;"
    ></div>
  </PageHeader>

  <div class="flex flex-col items-center justify-center px-[6%]">
    <div class="isolate mt-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
      <!-- Card 1 -->
      <div class="max-w-xl rounded-3xl p-8 ring-1 ring-gray-200 dark:ring-gray-700 lg:max-w-sm xl:p-9 dark:bg-gray-800">
        <p class="text-lg font-semibold leading-8 text-gray-900 dark:text-white lg:text-xl">
          {PLANS.BASIC.NAME}
        </p>

        <p class="lg:text-base mt-4 text-sm font-light leading-6 text-gray-500 dark:text-gray-400 lg:leading-6">
          {PLANS.BASIC.DESCRIPTION}
        </p>

        <p class="mt-6 flex items-baseline gap-x-1 text-4xl font-medium lg:text-4xl text-gray-900 dark:text-white">
          ${PLANS.BASIC.PRICE.MONTHLY}
        </p>
        <span class="text-base text-gray-500 dark:text-gray-400">Free forever</span>

        <a
          class="text-base mt-10 block w-full rounded-md bg-blue-700 dark:bg-blue-600 py-3 text-center font-medium text-white hover:bg-blue-800 dark:hover:bg-blue-700 lg:rounded-md lg:py-3 lg:text-lg lg:font-semibold transition-colors duration-200"
          href={PLANS.BASIC.CTA.LINK}
          target="_blank"
        >
          {PLANS.BASIC.CTA.LABEL}
        </a>

        <ul class="mt-8 space-y-2 text-sm text-gray-600 dark:text-gray-300 lg:space-y-5 xl:mt-10">
          {#each PLANS.BASIC.FEATURES as feature}
            <li class="flex items-center">
              <Checkmark
                size={24}
                fill="#1D4EE2"
                class="mr-2 scale-[70%] lg:mr-3 lg:scale-[100%]"
              />
              {feature}
            </li>
          {/each}
        </ul>
      </div>

      <!-- Card 2 -->
      <div class="cio-bg-blue max-w-xl rounded-3xl p-8 lg:max-w-lg xl:p-9 bg-blue-700 dark:bg-blue-800">
        <p class="text-lg font-semibold leading-8 text-white lg:text-xl">
          {PLANS.EARLY_ADOPTER.NAME}
        </p>

        <p class="lg:text-base mt-4 text-sm font-light leading-6 text-blue-100 lg:leading-6">
          {PLANS.EARLY_ADOPTER.DESCRIPTION}
        </p>

        {#key isYearlyPlan}
          <p class="mt-6 flex items-baseline gap-x-1 text-4xl font-medium text-white lg:text-4xl" in:fade>
            ${isYearlyPlan ? PLANS.EARLY_ADOPTER.PRICE.YEARLY : PLANS.EARLY_ADOPTER.PRICE.MONTHLY}
          </p>
          <span class="text-base text-blue-100" in:fade>
            per {isYearlyPlan ? 'year': 'month'}
          </span>
        {/key}

        <a
          class="text-base mt-10 block w-full rounded-md bg-white py-3 text-center font-medium text-blue-700 hover:bg-blue-50 lg:rounded-md lg:py-3 lg:text-lg lg:font-semibold transition-colors duration-200"
          href={PLANS.EARLY_ADOPTER.CTA.LINK}
          target="_blank"
        >
          {PLANS.EARLY_ADOPTER.CTA.LABEL}
        </a>
        <ul class="mt-8 space-y-3 text-sm font-light text-blue-100 lg:space-y-5 xl:mt-10">
          {#each PLANS.EARLY_ADOPTER.FEATURES as features}
            <li class="flex items-center">
              <Checkmark size={24} fill="#fff" class="mr-2 scale-[70%] lg:mr-3 lg:scale-[100%]" />
              {features}
            </li>
          {/each}
        </ul>
      </div>

      <!-- Card 3 -->
      <div class="max-w-xl rounded-3xl p-8 ring-1 ring-gray-200 dark:ring-gray-700 lg:max-w-sm xl:p-9 dark:bg-gray-800">
        <p class="text-lg font-semibold leading-8 text-gray-900 dark:text-white lg:text-xl">
          {PLANS.ENTERPRISE.NAME}
        </p>
        <p class="lg:text-base mt-4 text-sm font-light leading-6 text-gray-500 dark:text-gray-400 lg:leading-6">
          {PLANS.ENTERPRISE.DESCRIPTION}
        </p>
        <p class="mt-6 flex items-baseline gap-x-1 text-xl font-medium lg:mt-6 lg:text-xl text-gray-900 dark:text-white">
          Request Pricing
        </p>
        <button
          class="text-base mt-10 w-full rounded-md bg-blue-700 dark:bg-blue-600 py-3 font-medium text-white hover:bg-blue-800 dark:hover:bg-blue-700 lg:rounded-md lg:py-3 lg:text-lg lg:font-semibold transition-colors duration-200"
          data-cal-config={"{'layout':'month_view'}"}
          data-cal-link="classroomio/enterprise"
        >
          {PLANS.ENTERPRISE.CTA.LABEL}
        </button>

        <ul class="mt-8 space-y-2 text-sm text-gray-600 dark:text-gray-300 lg:space-y-5 xl:mt-10">
          {#each PLANS.ENTERPRISE.FEATURES as features}
            <li class="flex items-center">
              <Checkmark
                size={24}
                fill="#1D4EE2"
                class="mr-2 scale-[70%] lg:mr-3 lg:scale-[100%]"
              />
              {features}
            </li>
          {/each}
        </ul>
      </div>
    </div>
  </div>
</section>

<PageSignupCTA
  header="Bring your bootcamp vision online"
  subText="Try before you buy. No credit card required."
  btnLabel="Sign up for free"
  link="/signup"
  demo={false}
/>