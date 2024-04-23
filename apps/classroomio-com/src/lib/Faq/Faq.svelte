<script>
  import { faqs } from './faqs';
  import PageSignupCTA from '$lib/PageSignupCTA/index.svelte';
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
        <h1 class="text:md lg:text-base font-semibold leading-8 text-gray-800">
          {faq.question}
        </h1>
        <p
          class="text:md lg:text-base mt-2 font-light leading-7 tracking-wide text-gray-600 lg:leading-9"
        >
          {faq.answer}
        </p>
      </div>
    {/each}
  </div>

  <PageSignupCTA
    header="Launch Your Bootcamp Today"
    subText="Try before you buy. No credit card required."
    btnLabel="Book a demo"
    link="classroomio/demo"
  />
</div>
