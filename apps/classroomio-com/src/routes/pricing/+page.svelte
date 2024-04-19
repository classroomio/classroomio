<script>
  import Checkmark from 'carbon-icons-svelte/lib/Checkmark.svelte';
  import PLANS from 'shared-constants/src/plans/data.json';
  import PageSignupCTA from '$lib/PageSignupCTA/index.svelte';

  let isYearlyPlan = false;

  function toggleIsYearlyPlan() {
    isYearlyPlan = !isYearlyPlan;
  }
</script>

<section class="mt-[10%] md:mt-16">
  <header
    class="hero-bg lg:min-h-[30rem] pt-24 pb-16 w-full flex flex-col items-center justify-center text-center border-b border-slate-100"
  >
    <h1
      class="mx-auto text-4xl md:text-7xl lg:text-6xl font-bold text-slate-900 flex flex-col items-center"
    >
      <span>There is room for</span>
      <span class="text-blue-700 relative">Everyone.</span>
    </h1>
    <p class="w-[90%] md:w-[60%] text-center font-normal text-lg text-slate-700 mt-10 lg:mt-7">
      You get a customizable LMS, AI integration for productive educators and many more...
    </p>
    <div class="relative mt-10 flex items-center rounded-[30px] border-[2px] p-[2px] lg:scale-100">
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
  </header>
  <div class="flex flex-col items-center justify-center px-[6%]">
    <div class="isolate mt-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
      <!-- Card 1 -->
      <div class="max-w-xl rounded-3xl p-8 ring-1 ring-gray-200 lg:max-w-sm xl:p-9">
        <p class="text-lg font-semibold leading-8 text-gray-900 lg:text-xl">
          {PLANS.BASIC.NAME}
        </p>
        <p class="lg:text-md mt-4 text-sm font-light leading-6 text-gray-500 lg:leading-6">
          {PLANS.BASIC.DESCRIPTION}
        </p>
        <p class="mt-6 flex items-baseline gap-x-1 text-4xl font-medium lg:text-4xl">
          ${PLANS.BASIC.PRICE.MONTHLY}
          <!-- <sub class="text-base">/mo</sub> -->
        </p>
        <a
          class="text-md mt-10 block w-full rounded-md bg-slate-900 py-3 text-center font-medium text-white hover:bg-slate-700 lg:rounded-md lg:py-3 lg:text-lg lg:font-semibold"
          href={PLANS.BASIC.CTA.LINK}
          target="_blank"
        >
          {PLANS.BASIC.CTA.LABEL}
        </a>
        <ul class="mt-8 space-y-2 text-sm text-gray-600 lg:space-y-5 xl:mt-10">
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
      <div class="max-w-xl rounded-3xl bg-gray-900 p-8 lg:max-w-lg xl:p-9">
        <p class="text-lg font-semibold leading-8 text-white lg:text-xl">
          {PLANS.EARLY_ADOPTER.NAME}
        </p>
        <p class="lg:text-md mt-4 text-sm font-light leading-6 text-white lg:leading-6">
          {PLANS.EARLY_ADOPTER.DESCRIPTION}
        </p>
        <p class="mt-6 flex items-baseline gap-x-1 text-4xl font-medium text-white lg:text-4xl">
          ${isYearlyPlan ? PLANS.EARLY_ADOPTER.PRICE.YEARLY : PLANS.EARLY_ADOPTER.PRICE.MONTHLY}
          <!-- <sub class="text-base">/mo</sub> -->
        </p>
        <a
          class="text-md mt-10 block w-full rounded-md bg-white py-3 text-center font-medium text-slate-900 hover:bg-indigo-50 lg:rounded-md lg:py-3 lg:text-lg lg:font-semibold"
          href={PLANS.EARLY_ADOPTER.CTA.LINK}
          target="_blank"
        >
          {PLANS.EARLY_ADOPTER.CTA.LABEL}
        </a>
        <ul class="mt-8 space-y-3 text-sm font-light text-white lg:space-y-5 xl:mt-10">
          {#each PLANS.EARLY_ADOPTER.FEATURES as features}
            <li class="flex items-center">
              <Checkmark size={24} fill="#fff" class="mr-2 scale-[70%] lg:mr-3 lg:scale-[100%]" />
              {features}
            </li>
          {/each}
        </ul>
      </div>

      <!-- Card 3 -->
      <div class="max-w-xl rounded-3xl p-8 ring-1 ring-gray-200 lg:max-w-sm xl:p-9">
        <p class="text-lg font-semibold leading-8 text-gray-900 lg:text-xl">
          {PLANS.ENTERPRISE.NAME}
        </p>
        <p class="lg:text-md mt-4 text-sm font-light leading-6 text-gray-500 lg:leading-6">
          {PLANS.ENTERPRISE.DESCRIPTION}
        </p>
        <p class="mt-6 flex items-baseline gap-x-1 text-xl font-medium lg:mt-6 lg:text-xl">
          Request Pricing
        </p>
        <button
          class="text-md mt-10 w-full rounded-md bg-slate-900 py-3 font-medium text-white hover:bg-slate-700 lg:rounded-md lg:py-3 lg:text-lg lg:font-semibold"
          data-cal-config={"{'layout':'month_view'}"}
          data-cal-link="classroomio/enterprise"
        >
          {PLANS.ENTERPRISE.CTA.LABEL}
        </button>

        <ul class="mt-8 space-y-2 text-sm text-gray-600 lg:space-y-5 xl:mt-10">
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
        credit Card required.
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

<PageSignupCTA
  header="Launch Your First Training in Minutes"
  subText="Try before you buy. No credit card required."
  btnLabel="Sign up"
  link="/signup"
  demo={false}
/>
