<script>
  import { faqs as defaultFaqs } from '$lib/utils/faqs';
  import { PageSignupCTA } from '$lib/components';
  import * as Accordion from '@cio/ui/base/accordion';

  /**
   * @typedef {Object} FaqItem
   * @property {string} question
   * @property {string} answer
   */

  /**
   * @typedef {Object} Props
   * @property {FaqItem[]} [items]   Override the global FAQ list
   * @property {boolean}   [hideCta] Hide the trailing PageSignupCTA when the page already has its own
   * @property {string}    [heading]
   * @property {string}    [subheading]
   */

  /** @type {Props} */
  let { items, hideCta = false, heading, subheading } = $props();

  const entries = $derived(items ?? defaultFaqs);
</script>

<div class="mt-10 mb-20 flex flex-col items-center justify-center gap-6">
  <header class="space-y-2 text-center">
    <h1 class="mt-2 text-xl md:text-4xl">{heading ?? 'Questions & Answers'}</h1>
    <p
      class="ui:text-muted-foreground text-sm font-normal tracking-normal md:text-lg lg:px-[20%] lg:text-xl lg:tracking-wide"
    >
      {#if subheading}
        {subheading}
      {:else}
        Can't find the answer you're looking for?
        <a class="text-blue-700 hover:underline" href="mailto:help@classroomio.com" target="_blank">Shoot us an email</a
        > and we'll get back to you ASAP.
      {/if}
    </p>
  </header>

  <div class="mx-auto w-full max-w-3xl px-2 lg:m-0">
    <Accordion.Root type="single" class="w-full">
      {#each entries as faq, index}
        <Accordion.Item value="faq-{index}">
          <Accordion.Trigger>{faq.question}</Accordion.Trigger>
          <Accordion.Content>
            {faq.answer}
          </Accordion.Content>
        </Accordion.Item>
      {/each}
    </Accordion.Root>
  </div>

  {#if !hideCta}
    <PageSignupCTA
      header="Your Custom Academy – Up & Running in Minutes!"
      subText="Try before you buy. No credit card required."
      btnLabel="Book a demo"
      link="classroomio/demo"
    />
  {/if}
</div>
