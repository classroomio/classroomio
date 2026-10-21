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

<div class="max-w-content xl:py-section mx-auto w-full py-20 md:py-28">
  <div class="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
    <header class="lg:sticky lg:top-28 lg:col-span-4 lg:self-start">
      <h1 class="text-h3 text-balance">{heading ?? 'Questions & Answers'}</h1>
      <p class="ui:text-muted-foreground text-lead mt-[18px] text-pretty">
        {#if subheading}
          {subheading}
        {:else}
          Can't find the answer you're looking for?
          <a class="text-blue-700 hover:underline" href="mailto:help@classroomio.com" target="_blank"
            >Shoot us an email</a
          > and we'll get back to you ASAP.
        {/if}
      </p>
    </header>

    <div class="lg:col-span-8">
      <Accordion.Root type="single" class="flex w-full flex-col gap-2">
        {#each entries as faq, index}
          <Accordion.Item
            value="faq-{index}"
            class="relative rounded-md border-b-0! bg-gray-50"
            style="z-index: {entries.length - index}"
          >
            <Accordion.Trigger class="items-center! px-6 py-5! hover:no-underline!">
              <span class="text-card-title">{faq.question}</span>
            </Accordion.Trigger>
            <Accordion.Content class="px-6 pb-6! text-[15px] leading-relaxed">
              {faq.answer}
            </Accordion.Content>
            <span
              aria-hidden="true"
              class="cio-notch pointer-events-none absolute -top-px left-6 z-[4] h-[11px] w-[46px] bg-white"
            ></span>
            {#if index < entries.length - 1}
              <span
                aria-hidden="true"
                class="cio-tab pointer-events-none absolute -bottom-3 left-6 z-[3] h-3 w-[47.2px] bg-gray-50"
              ></span>
            {/if}
          </Accordion.Item>
        {/each}
      </Accordion.Root>
    </div>
  </div>

  {#if !hideCta}
    <div class="mt-20">
      <PageSignupCTA
        header="Your custom academy, up and running in minutes."
        subText="Try before you buy. No credit card required."
        btnLabel="Book a demo"
        link="classroomio/demo"
      />
    </div>
  {/if}
</div>
