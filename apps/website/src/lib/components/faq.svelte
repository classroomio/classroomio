<script>
  import { faqs } from '$lib/utils/faqs';
  import { PageSignupCTA } from '$lib/components';
  import * as Accordion from '@cio/ui/base/accordion';
</script>

<div class="mb-20 mt-10 flex flex-col items-center justify-center">
  <header class="text-center">
    <h1 class="mt-2 text-xl md:text-4xl">
      Questions & Answers
    </h1>
    <p
      class="mt-4 text-sm md:text-lg font-normal tracking-normal ui:text-muted-foreground lg:px-[20%] lg:text-xl lg:tracking-wide"
    >
      Can't find the answer you're looking for?
      <a class="font-semibold text-blue-700" href="mailto:help@classroomio.com" target="_blank"
        >Shoot us an email</a> and we'll get back to you ASAP.
    </p>
  </header>

  <div class="mt-[20%] lg:m-0 max-w-3xl w-full mx-auto px-2">
    <Accordion.Root type="single" class="w-full">
      {#each faqs as faq, index}
        <Accordion.Item value="faq-{index}">
          <Accordion.Trigger>{faq.question}</Accordion.Trigger>
          <Accordion.Content>
            {faq.answer}
          </Accordion.Content>
        </Accordion.Item>
      {/each}
    </Accordion.Root>
  </div>

  <PageSignupCTA
    header="Your Custom Academy – Up & Running in Minutes!"
    subText="Try before you buy. No credit card required."
    btnLabel="Book a demo"
    link="classroomio/demo"
  />
</div>
