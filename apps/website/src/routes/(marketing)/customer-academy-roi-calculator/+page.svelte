<script>
  import { HeroSubtitle, PageHeader, PageSignupCTA } from '$lib/components';
  import { CtaButton, Section, SectionHeader } from '$lib/components/ui';
  import { Badge } from '@cio/ui/base/badge';
  import { NumberField } from '@cio/ui/custom/number-field';
  import Calculator from '@lucide/svelte/icons/calculator';

  let monthlyTickets = $state(400);
  let howToShare = $state(40);
  let deflectionRate = $state(25);
  let costPerTicket = $state(15);
  let academyCost = $state(35);

  const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  const ticketsDeflected = $derived(
    Math.round(((monthlyTickets ?? 0) * (howToShare ?? 0) * (deflectionRate ?? 0)) / 10000)
  );
  const monthlySaving = $derived(ticketsDeflected * (costPerTicket ?? 0));
  const monthlyNet = $derived(monthlySaving - (academyCost ?? 0));
  const yearlyNet = $derived(monthlyNet * 12);
  const verdict = $derived(
    monthlyNet > 0
      ? `At these numbers the academy covers its own cost and leaves about ${money.format(monthlyNet)} a month.`
      : 'At these numbers the academy does not cover its cost on ticket savings alone. Try a lower cost, or count the other benefits separately.'
  );
</script>

<section class="bg-white">
  <PageHeader className="px-6 md:px-10">
    <div class="mx-auto flex max-w-[900px] flex-col items-center text-center">
      <Badge variant="outline" class="mb-6 gap-2! bg-white px-3.5! py-1.5!">
        <Calculator size={14} class="text-blue-700" />
        Free calculator
      </Badge>
      <h1 class="text-display text-balance text-gray-950">Customer academy ROI calculator</h1>
      <HeroSubtitle class="mx-auto">
        Estimate how many support tickets a customer academy could answer before they are sent, and what that is worth.
        Every number below is an assumption you can change.
      </HeroSubtitle>
    </div>
  </PageHeader>

  <Section class="bg-white">
    <div class="mx-auto grid max-w-[1000px] grid-cols-1 gap-10 lg:grid-cols-2">
      <div class="flex flex-col gap-5">
        <h2 class="text-h4 font-medium text-gray-950">Your numbers</h2>
        <p class="text-[15px] text-gray-500">
          The starting values are examples, not benchmarks. Replace them with figures from your help desk.
        </p>
        <NumberField label="Support tickets per month" integer min={0} max={1000000} bind:value={monthlyTickets} />
        <NumberField
          label="Share that are how-to questions (%)"
          helperMessage="Tickets a course could answer, such as setup and feature questions."
          min={0}
          max={100}
          bind:value={howToShare}
        />
        <NumberField
          label="Share of those the academy answers first (%)"
          helperMessage="Your best guess. Start low."
          min={0}
          max={100}
          bind:value={deflectionRate}
        />
        <NumberField
          label="Cost of one ticket (USD)"
          helperMessage="Agent time and tooling, divided by tickets handled."
          min={0}
          max={100000}
          bind:value={costPerTicket}
        />
        <NumberField label="Academy cost per month (USD)" min={0} max={100000} bind:value={academyCost} />
      </div>

      <div class="flex flex-col gap-6 rounded-xl bg-gray-50 p-8 ring-1 ring-gray-200">
        <h2 class="text-h4 font-medium text-gray-950">What it comes to</h2>
        <dl class="flex flex-col gap-4">
          <div>
            <dt class="text-label font-mono text-gray-500 uppercase">Tickets answered by the academy</dt>
            <dd class="text-h3 text-gray-950">{ticketsDeflected} a month</dd>
          </div>
          <div>
            <dt class="text-label font-mono text-gray-500 uppercase">Support cost avoided</dt>
            <dd class="text-h3 text-gray-950">{money.format(monthlySaving)} a month</dd>
          </div>
          <div>
            <dt class="text-label font-mono text-gray-500 uppercase">Net of the academy cost, per year</dt>
            <dd class="text-h3 text-gray-950">{money.format(yearlyNet)} a year</dd>
          </div>
        </dl>
        <p class="text-[15px] leading-relaxed text-gray-700">{verdict}</p>
        <p class="text-caption text-gray-500">
          The formula is tickets × how-to share × academy share × cost per ticket, minus the academy cost. It counts
          support savings only. It leaves out retention, adoption and certification, which are harder to estimate.
        </p>
        <div class="flex flex-wrap gap-3">
          <CtaButton href="/signup">Start free</CtaButton>
          <CtaButton href="/customer-education" variant="secondary">See customer academy software</CtaButton>
        </div>
      </div>
    </div>
  </Section>

  <PageSignupCTA
    variant="brand"
    header="Launch your customer academy."
    subText="Build a branded learning portal customers actually use. Start on the free plan."
    btnLabel="Book a Demo"
  />
</section>
