<script>
  import Checkmark from 'carbon-icons-svelte/lib/Checkmark.svelte';
  import PLANS from 'shared-constants/src/plans.json';

  let isYearlyPlan = false;

  function toggleIsYearlyPlan() {
    isYearlyPlan = !isYearlyPlan;
  }

  const freeFeatures = [
    'Unlimited Courses',
    'Unlimited Conversations',
    '50 Students',
    'AI Course Builder (no video upload)',
    'Course Landing Page',
    'Live chat & Live polls',
    '20 AI Prompts'
  ];

  const proFeatures = [
    'Everything in Free',
    '1000 Students',
    'Advanced AI Course Builder (video upload)',
    'Lesson/Course PDF Download',
    'Certificates',
    '2000 AI Prompts',
    'Remove ClassroomIO Branding',
    'Email Support'
  ];
  const teamFeatures = [
    'Everything in Pro',
    'Unlimited students',
    'Unlimited AI Prompts',
    'White Labelling',
    'Priority Support'
  ];
</script>

<section id="pricing" class="py-[12%]">
  <div class="flex flex-col items-center justify-center px-[6%]">
    <div class="mb-[3%] text-center">
      <h1 id="pricing" class="text-md font-semibold tracking-wide text-blue-700">Pricing</h1>
      <h2 class="my-5 text-3xl font-semibold tracking-tight text-gray-900 lg:my-4 lg:text-4xl">
        For teams and individuals
      </h2>
      <p class="mt-4 text-lg tracking-normal text-gray-500 lg:tracking-wide">
        Customizable LMS, AI integration for productive educators and many more...
      </p>
    </div>

    <div
      class="relative mt-10 flex items-center rounded-[30px] border-[2px] p-[2px] lg:mt-0 lg:scale-100"
    >
      <button
        style="background-color: {isYearlyPlan ? 'initial' : '#1D4EE2'}; color: {isYearlyPlan
          ? '#5e636b'
          : '#fff'}"
        class="rounded-[30px] bg-blue-700 px-3 py-1 text-xs text-white lg:px-4 lg:py-2"
        on:click={toggleIsYearlyPlan}>Monthly</button
      >
      <button
        style="background-color: {isYearlyPlan ? '#1D4EE2' : ''}; color: {isYearlyPlan
          ? '#fff'
          : '#5e636b'}"
        class="rounded-[30px] px-3 py-1 text-xs text-white lg:px-4 lg:py-2"
        on:click={toggleIsYearlyPlan}>Annually</button
      >
      <div
        class="absolute right-[-40%] top-[-85%] scale-[90%] rounded-full bg-[#006600] px-3.5 py-1.5 text-xs text-white lg:right-[-43%] lg:top-[-75%] lg:scale-100"
      >
        Save 2 months
      </div>
    </div>

    <div class="isolate mt-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
      <!-- card 1 -->
      <div class="max-w-xl rounded-3xl p-8 ring-1 ring-gray-200 lg:max-w-sm xl:p-9">
        <p class="text-lg font-semibold leading-8 text-gray-900 lg:text-xl">Hobby</p>
        <p class="lg:text-md mt-4 text-sm font-light leading-6 text-gray-500 lg:leading-6">
          For personal use. Hobby plan is free for up to 5 courses forever, no credit card required.
        </p>
        <p class="mt-6 flex items-baseline gap-x-1 text-4xl font-medium lg:text-4xl">
          ${PLANS.FREE.PRICE.MONTHLY} <sub class="text-base">/mo</sub>
        </p>
        <button
          class="text-md mt-10 w-full rounded-md bg-slate-900 py-3 font-medium text-white hover:bg-slate-700 lg:rounded-md lg:py-3 lg:text-lg lg:font-semibold"
          data-cal-config={"{'layout':'month_view'}"}
          data-cal-link="classroomio/demo"
        >
          Get started
        </button>
        <ul class="mt-8 space-y-2 text-sm text-gray-600 lg:space-y-5 xl:mt-10">
          {#each PLANS.FREE.FEATURES as freeFeature}
            <li class="flex items-center">
              <Checkmark
                size={24}
                fill="#1D4EE2"
                class="mr-2 scale-[70%] lg:mr-3 lg:scale-[100%]"
              />
              {freeFeature}
            </li>
          {/each}
        </ul>
      </div>

      <!-- card 2 -->
      <div class="max-w-xl rounded-3xl bg-gray-900 p-8 lg:max-w-lg xl:p-9">
        <p class="text-lg font-semibold leading-8 text-white lg:text-xl">Pro</p>
        <p class="lg:text-md mt-4 text-sm font-light leading-6 text-white lg:leading-6">
          Advanced features for small teaching businesses. Built for scale.
        </p>
        <p class="mt-6 flex items-baseline gap-x-1 text-4xl font-medium text-white lg:text-4xl">
          ${isYearlyPlan ? PLANS.PRO.PRICE.YEARLY : PLANS.PRO.PRICE.MONTHLY}
          <sub class="text-base">/member</sub>
        </p>
        <button
          class="text-md mt-10 w-full rounded-md bg-white py-3 font-medium text-slate-900 hover:bg-indigo-50 lg:rounded-md lg:py-3 lg:text-lg lg:font-semibold"
          data-cal-config={"{'layout':'month_view'}"}
          data-cal-link="classroomio/demo"
        >
          Get Started
        </button>
        <ul class="mt-8 space-y-3 text-sm font-light text-white lg:space-y-5 xl:mt-10">
          {#each PLANS.PRO.FEATURES as proFeature}
            <li class="flex items-center">
              <Checkmark size={24} fill="#fff" class="mr-2 scale-[70%] lg:mr-3 lg:scale-[100%]" />
              {proFeature}
            </li>
          {/each}
        </ul>
      </div>

      <!-- card 3 -->
      <div class="max-w-xl rounded-3xl p-8 ring-1 ring-gray-200 lg:max-w-sm xl:p-9">
        <p class="text-lg font-semibold leading-8 text-gray-900 lg:text-xl">Team</p>
        <p class="lg:text-md mt-4 text-sm font-light leading-6 text-gray-500 lg:leading-6">
          Best suited for teams and larger businesses that need more control.
        </p>
        <p class="mt-6 flex items-baseline gap-x-1 text-4xl font-medium lg:mt-6 lg:text-4xl">
          ${isYearlyPlan ? PLANS.TEAM.PRICE.YEARLY : PLANS.TEAM.PRICE.MONTHLY}
          <sub class="text-base">/member</sub>
        </p>
        <button
          class="text-md mt-10 w-full rounded-md bg-slate-900 py-3 font-medium text-white hover:bg-slate-700 lg:rounded-md lg:py-3 lg:text-lg lg:font-semibold"
          data-cal-config={"{'layout':'month_view'}"}
          data-cal-link="classroomio/demo"
        >
          Get started
        </button>

        <ul class="mt-8 space-y-2 text-sm text-gray-600 lg:space-y-5 xl:mt-10">
          {#each PLANS.TEAM.FEATURES as teamFeature}
            <li class="flex items-center">
              <Checkmark
                size={24}
                fill="#1D4EE2"
                class="mr-2 scale-[70%] lg:mr-3 lg:scale-[100%]"
              />
              {teamFeature}
            </li>
          {/each}
        </ul>
      </div>
    </div>

    <!-- <div
      class="flex flex-col lg:flex-row items-start lg:items-center mx-auto lg:mx-10 mt-[5%] border-[1px] rounded-[30px] py-[10%] lg:py-[5%] px-[10px] lg:px-[30px] lg:w-full md:max-w-[550px] lg:max-w-full"
    >
      <div class="mr-5 pl-5">
        <h2
          class="text-md lg:text-xl font-semibold font-display leading-8 tracking-wide lg:tracking-tight text-blue-700 mb-0 lg:mb-4"
        >
          Hobby
        </h2>
        <p
          class="m-0 lg:mt-1 text-md leading-7 lg:leading-6 text-gray-600"
        >
          For personal use. Hobby plan is free for up to 5 courses forever, no
          credit card required.
        </p>
      </div>
        <button
          class="font-semibold text-base lg:text-md text-white leading-5 mt-5 lg:m-0 p-4 lg:py-5 ml-5 bg-blue-700 rounded-lg lg:rounded-md w-[70%] lg:w-full"
        >
          Create a free account
        </button>
    </div> -->
  </div>
</section>
