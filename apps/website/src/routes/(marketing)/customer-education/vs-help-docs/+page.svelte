<script lang="ts">
  import { HeroSubtitle, PageHeader, PageSignupCTA, VsHelpDocs } from '$lib/components';
  import { CtaButton, NotchCard, Section, SectionHeader } from '$lib/components/ui';
  import { Badge } from '@cio/ui/base/badge';
  import { BlurFade } from '@cio/ui/custom/animation/blurfade';
  import FileText from '@lucide/svelte/icons/file-text';
  import GraduationCap from '@lucide/svelte/icons/graduation-cap';

  const competitors = [
    {
      name: 'Intercom Articles',
      good: 'Best-in-class in-app help widget. Great search. Where short-form, "right-now" answers belong.',
      missing: 'No sequenced learning paths. No assessments. No certification. No per-learner progress.'
    },
    {
      name: 'Zendesk Guide',
      good: 'Mature knowledge base, deeply integrated with Zendesk tickets. Excellent for tier-1 deflection.',
      missing: 'No course structure, no grading, no certificates. Built for support, not for learning.'
    },
    {
      name: 'Confluence',
      good: 'The default internal docs tool. Cheap, ubiquitous, easy to write into.',
      missing: 'Not customer-facing by default. No course primitives. No public certs. No learner analytics.'
    }
  ];

  const verdicts = [
    {
      Icon: FileText,
      title: 'Keep your help docs.',
      body: "When a customer already knows what they need, they search. Help docs win at lookup. Don't rip out the tool that already does that job well."
    },
    {
      Icon: GraduationCap,
      title: 'Add a customer academy alongside.',
      body: "When a customer needs to learn the product (onboarding, role-based programs, certification, adoption courses for new features), that's the job an academy was built for."
    }
  ];
</script>

<section class="bg-white">
  <PageHeader className="px-6 md:px-10">
    <div class="max-w-content mx-auto">
      <Badge variant="outline" class="mb-6 gap-2! bg-white px-3.5! py-1.5!">Customer academy vs help docs</Badge>

      <h1 class="text-display max-w-[1000px] text-balance text-gray-950">
        Why your help center
        <em class="text-blue-700 not-italic">isn't teaching</em>
        your customers.
      </h1>

      <HeroSubtitle>
        Intercom Articles, Zendesk Guide, and Confluence are excellent at one thing: answering "how do I do X?" when the
        user already knows what they need. They were never designed to take a brand-new customer from zero to confident
        product use. That's what a customer academy is for.
      </HeroSubtitle>

      <div class="mt-9 flex flex-wrap items-center gap-3">
        <CtaButton href="/signup">Launch your academy free</CtaButton>
        <CtaButton href="/customer-education" variant="secondary">See a live academy</CtaButton>
      </div>
    </div>
  </PageHeader>

  <Section>
    <SectionHeader eyebrow="The short answer" eyebrowClass="text-blue-700" titleClass="" class="mb-12 md:mb-16">
      {#snippet title()}You need both. They do different jobs.{/snippet}
    </SectionHeader>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
      {#each verdicts as v, i}
        <BlurFade delay={0.1 * i} once class="h-full">
          <NotchCard class="h-full bg-gray-50">
            <div
              class="mb-5 flex size-10 items-center justify-center rounded-md bg-white text-blue-700 ring-1 ring-gray-200"
            >
              <v.Icon size={20} strokeWidth={1.8} />
            </div>
            <h3 class="text-card-title font-medium text-gray-950">{v.title}</h3>
            <p class="mt-3 text-[15px] leading-relaxed text-gray-600">{v.body}</p>
          </NotchCard>
        </BlurFade>
      {/each}
    </div>
  </Section>

  <VsHelpDocs bgClass="bg-gray-50" showHeading={true} />

  <Section>
    <SectionHeader eyebrow="Tool-by-tool" eyebrowClass="text-blue-700" titleClass="" class="mb-12 md:mb-16">
      {#snippet title()}What the popular help-doc tools are great at, and what they aren't.{/snippet}
    </SectionHeader>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
      {#each competitors as competitor, i}
        <BlurFade delay={0.08 * i} once class="h-full">
          <div class="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-6 md:p-7">
            <p class="text-card-title font-medium text-gray-950">{competitor.name}</p>
            <div class="mt-6">
              <p class="text-tag font-mono text-emerald-600 uppercase">Where it wins</p>
              <p class="mt-2 text-[15px] leading-relaxed text-gray-600">{competitor.good}</p>
            </div>
            <div class="mt-6">
              <p class="text-tag font-mono text-rose-600 uppercase">Where it doesn't</p>
              <p class="mt-2 text-[15px] leading-relaxed text-gray-600">{competitor.missing}</p>
            </div>
          </div>
        </BlurFade>
      {/each}
    </div>
  </Section>

  <PageSignupCTA
    header="Stop forwarding help articles to every new customer."
    subText="Bundle the articles into a real onboarding course, add a final assessment, issue a certificate, and watch retention move."
    btnLabel="Book a Demo"
  />
</section>
