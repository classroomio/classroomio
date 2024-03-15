<script>
  import { faqs } from './faqs';
</script>

<div class="mb-[15%] mt-[5%]">
  <header class="mb-[5%] px-[8%] text-center">
    <h1 class="mt-2 text-4xl font-medium tracking-tight text-gray-900 lg:text-4xl">
      Questions & Answers
    </h1>
    <p
      class="mt-4 text-lg font-normal tracking-normal text-gray-600 lg:px-[20%] lg:text-xl lg:tracking-wide"
    >
      Can’t find the answer you’re looking for?
      <a class="font-semibold text-blue-700" href="mailto:help@classroomio.com" target="_blank"
        >Shoot us an email</a
      > and we’ll get back to you ASAP.
    </p>
  </header>

  <div class="mt-[20%] grid grid-cols-1 gap-10 lg:m-0 lg:grid-cols-3 lg:gap-20 lg:px-[13%]">
    {#each faqs as faq}
      <div class="max-w-[100%] px-6 lg:p-0">
        <h1 class="text:md lg:text-md font-semibold leading-8 text-gray-800">
          {faq.question}
        </h1>
        <p
          class="text:md lg:text-md mt-2 font-light leading-7 tracking-wide text-gray-600 lg:leading-9"
        >
          {faq.answer}
        </p>
      </div>
    {/each}
  </div>

  <div
    class="floating grad relative mx-auto mt-[10%] flex h-[61vh] w-[100%] flex-col items-center justify-center px-[6%] py-[12%] text-center shadow-2xl lg:h-[54vh] lg:w-[70%] lg:rounded-3xl"
  >
    <h1 class="font-display mt-3 text-3xl font-bold tracking-tight text-white lg:mt-2 lg:text-4xl">
      Launch Your Bootcamp Today
    </h1>
    <p class="mt-6 text-xl text-gray-300 lg:text-lg">
      Try before you buy. No credit card required.
    </p>
    <button
      class="text-md mt-10 rounded-md bg-white px-6 py-4 font-semibold text-gray-900 lg:px-7 lg:py-3 lg:text-lg"
      data-cal-config={"{'layout':'month_view'}"}
      data-cal-link="classroomio/demo"
    >
      Book a demo
    </button>
  </div>
</div>

<style>
  .grad {
    background: rgb(51, 16, 71);
    background: radial-gradient(circle at 50% 100%, rgba(51, 16, 71, 1) 1%, rgba(2, 0, 36, 1) 100%);
    background-size: cover;
  }
</style>
