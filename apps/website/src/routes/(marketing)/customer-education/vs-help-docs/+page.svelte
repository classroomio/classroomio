<script lang="ts">
  import { HeroSubtitle, PageHeader, PageSignupCTA, VsHelpDocs } from '$lib/components';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
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
      body: "When a customer needs to learn the product — onboarding, role-based programs, certification, adoption courses for new features — that's the job an academy was built for."
    }
  ];
</script>

<section class="bg-white">
  <PageHeader className="px-6 lg:px-12">
    <div class="mx-auto max-w-[1100px]">
      <BlurFade delay={0} once>
        <Badge variant="outline" class="mb-6 gap-2! bg-white px-3.5! py-1.5!">Customer academy vs help docs</Badge>
      </BlurFade>

      <BlurFade delay={0.1} once>
        <h1
          class="max-w-[820px] text-[clamp(2rem,3.4vw,2.8rem)] leading-[1.1] font-medium tracking-tight text-gray-950"
        >
          Why your help center
          <em class="text-blue-700 not-italic">isn't teaching</em>
          your customers.
        </h1>
      </BlurFade>

      <BlurFade delay={0.2} once>
        <HeroSubtitle>
          Intercom Articles, Zendesk Guide, and Confluence are excellent at one thing — answering "how do I do X?" when
          the user already knows what they need. They were never designed to take a brand-new customer from zero to
          confident product use. That's what a customer academy is for.
        </HeroSubtitle>
      </BlurFade>

      <BlurFade delay={0.3} once>
        <div class="mt-8 flex flex-wrap items-center gap-3">
          <Button href="/signup">Launch your academy free</Button>
          <Button href="/customer-education" variant="outline">See a live academy</Button>
        </div>
      </BlurFade>
    </div>
  </PageHeader>

  <!-- Quick verdict cards -->
  <section class="px-6 py-12 lg:px-12 lg:py-16">
    <div class="mx-auto max-w-[1100px]">
      <div class="mb-8 max-w-[640px]">
        <div class="mb-2 text-xs font-medium tracking-widest text-blue-700 uppercase">The short answer</div>
        <h2 class="text-[clamp(1.75rem,2.6vw,2.2rem)] leading-[1.15] font-medium tracking-tight">
          You need both. They do different jobs.
        </h2>
      </div>

      <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
        {#each verdicts as v, i}
          <BlurFade delay={0.1 * i} once>
            <div class="h-full rounded-2xl border border-gray-200 bg-gray-50 p-7">
              <div
                class="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-700 ring-1 ring-gray-200"
              >
                <v.Icon size={20} strokeWidth={1.75} />
              </div>
              <h3 class="text-base font-medium text-gray-950">{v.title}</h3>
              <p class="mt-3 text-sm leading-relaxed text-gray-600">{v.body}</p>
            </div>
          </BlurFade>
        {/each}
      </div>
    </div>
  </section>

  <!-- The detailed comparison -->
  <VsHelpDocs bgClass="bg-gray-50" showHeading={true} />

  <!-- Compared head-to-head -->
  <section class="px-6 py-12 lg:px-12 lg:py-16">
    <div class="mx-auto max-w-[1100px]">
      <div class="mb-8 max-w-[640px]">
        <div class="mb-2 text-xs font-medium tracking-widest text-blue-700 uppercase">Tool-by-tool</div>
        <h2 class="text-[clamp(1.75rem,2.6vw,2.2rem)] leading-[1.15] font-medium tracking-tight">
          What the popular help-doc tools are great at — and what they aren't.
        </h2>
      </div>

      <div class="grid grid-cols-1 gap-5 md:grid-cols-3">
        {#each competitors as competitor, i}
          <BlurFade delay={0.08 * i} once>
            <div class="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6">
              <p class="text-base font-medium text-gray-950">{competitor.name}</p>
              <div class="mt-5">
                <p class="text-[10px] tracking-wider text-emerald-600 uppercase">Where it wins</p>
                <p class="mt-1.5 text-sm leading-relaxed text-gray-600">{competitor.good}</p>
              </div>
              <div class="mt-5">
                <p class="text-[10px] tracking-wider text-rose-600 uppercase">Where it doesn't</p>
                <p class="mt-1.5 text-sm leading-relaxed text-gray-600">{competitor.missing}</p>
              </div>
            </div>
          </BlurFade>
        {/each}
      </div>
    </div>
  </section>

  <PageSignupCTA
    header="Stop forwarding help articles to every new customer."
    subText="Bundle the articles into a real onboarding course, add a final assessment, issue a certificate, and watch retention move."
    btnLabel="Book a Demo"
  />
</section>
