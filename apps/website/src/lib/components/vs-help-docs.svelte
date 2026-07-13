<script>
  import { BlurFade } from '@cio/ui/custom/animation/blurfade';
  import Check from '@lucide/svelte/icons/check';
  import X from '@lucide/svelte/icons/x';

  /**
   * @typedef {Object} Props
   * @property {string} [bgClass]
   * @property {string} [eyebrow]
   * @property {string} [heading]
   * @property {string} [subhead]
   * @property {boolean} [showHeading]
   */

  /** @type {Props} */
  let {
    bgClass = 'bg-white',
    eyebrow = 'Help docs are not an academy',
    heading = 'Reading docs isn’t the same as learning.',
    subhead = 'Intercom Articles, Zendesk Guide, and Confluence are great at one thing — answering "how do I do X?" when the user already knows what they need. They were never built to teach.',
    showHeading = true
  } = $props();

  const rows = [
    {
      capability: 'Sequenced learning path',
      docs: false,
      academy: true,
      note: 'A course goes from "what this product is" to "I can do this unsupervised." Docs are alphabetical, not sequential.'
    },
    {
      capability: 'Assessment & quiz grading',
      docs: false,
      academy: true,
      note: 'You can’t prove someone understood an article. You can prove they passed a 12-question final.'
    },
    {
      capability: 'Certificates & verifiable IDs',
      docs: false,
      academy: true,
      note: 'A shareable cert turns power-users into a public community. Help docs don’t.'
    },
    {
      capability: 'Cohorts / multi-course paths',
      docs: false,
      academy: true,
      note: 'Onboarding week, admin track, power-user path — three audiences, three sequenced journeys, one academy.'
    },
    {
      capability: 'AI tutor inside the lesson',
      docs: false,
      academy: true,
      note: 'Lesson-aware Claude tutor answers follow-ups before the learner bounces to a support ticket.'
    },
    {
      capability: 'Per-learner progress & analytics',
      docs: false,
      academy: true,
      note: 'See who finished, who stalled, where they got stuck. Page-view analytics don’t answer "did this customer learn?"'
    },
    {
      capability: 'Branded portal on your domain',
      docs: true,
      academy: true,
      note: 'Both can. Help-doc tools usually charge extra for it. ClassroomIO doesn’t.'
    },
    {
      capability: 'Search & quick lookup',
      docs: true,
      academy: false,
      note: 'When someone already knows what they need, docs win. Pair an academy with your docs — don’t replace them.'
    },
    {
      capability: 'In-product contextual answers',
      docs: true,
      academy: false,
      note: 'Help widgets in-app are still where short-form, "right now" answers belong.'
    }
  ];
</script>

<section class="{bgClass} px-6 py-16 lg:px-12 lg:py-24">
  <div class="mx-auto max-w-[1100px]">
    {#if showHeading}
      <div class="mb-12 max-w-[680px]">
        <div class="mb-3 text-xs font-medium tracking-widest text-blue-700 uppercase">{eyebrow}</div>
        <h2 class="text-[clamp(2rem,3vw,2.8rem)] leading-[1.15] font-medium tracking-tight">{heading}</h2>
        <p class="mt-5 text-base leading-relaxed text-gray-500">{subhead}</p>
      </div>
    {/if}

    <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div
        class="grid grid-cols-[1.6fr_repeat(2,minmax(0,0.8fr))_1.4fr] gap-0 border-b border-gray-200 bg-gray-50 px-5 py-3.5 text-[11px] font-medium tracking-widest text-gray-500 uppercase"
      >
        <div>Capability</div>
        <div class="text-center">Help docs</div>
        <div class="text-center">Company academy</div>
        <div class="hidden lg:block">Why it matters</div>
      </div>

      {#each rows as row, i}
        <BlurFade delay={0.03 * i} once>
          <div
            class="grid grid-cols-[1.6fr_repeat(2,minmax(0,0.8fr))_1.4fr] items-start gap-0 border-b border-gray-100 px-5 py-4 text-sm last:border-b-0 hover:bg-blue-50/30"
          >
            <div class="font-medium text-gray-950">{row.capability}</div>

            <div class="flex justify-center">
              {#if row.docs}
                <span class="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <Check size={16} strokeWidth={2.5} />
                </span>
              {:else}
                <span class="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                  <X size={16} strokeWidth={2.5} />
                </span>
              {/if}
            </div>

            <div class="flex justify-center">
              {#if row.academy}
                <span
                  class="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                >
                  <Check size={16} strokeWidth={2.5} />
                </span>
              {:else}
                <span class="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                  <X size={16} strokeWidth={2.5} />
                </span>
              {/if}
            </div>

            <div class="hidden text-xs leading-relaxed text-gray-500 lg:block">{row.note}</div>
          </div>
        </BlurFade>
      {/each}
    </div>

    <p class="mt-6 text-xs text-gray-500">
      Compared against typical capabilities of Intercom Articles, Zendesk Guide, and Confluence at time of writing. Run
      your own academy alongside your existing help center — most teams who launch a customer academy keep both.
    </p>
  </div>
</section>
