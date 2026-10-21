<script>
  import { BlurFade } from '@cio/ui/custom/animation/blurfade';
  import { MachineCertificatePress } from '@cio/ui/custom/animation/machines';
  import MachineCard from './ui/machine-card.svelte';
  import Section from './ui/section.svelte';
  import SectionHeader from './ui/section-header.svelte';

  const steps = [
    {
      number: '01',
      title: 'Invite your team',
      description:
        'Add users individually, bulk import via CSV, or connect your HRIS. Assign courses automatically based on role or department.'
    },
    {
      number: '02',
      title: 'Publish your courses',
      description:
        'Build courses with video, text, quizzes, and assignments. Set pass thresholds, enforce order, and control who sees what.'
    },
    {
      number: '03',
      title: 'Set certification rules',
      description:
        'Define expiry dates, renewal requirements, and passing scores. Issue branded certificates automatically on completion.'
    }
  ];
</script>

<Section id="features" class="bg-gray-950 text-white">
  <div class="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
    <BlurFade once>
      <SectionHeader
        align="left"
        eyebrow="Certifications & Compliance"
        eyebrowClass="text-blue-400"
        titleClass="text-white"
        ledeClass="text-gray-500"
        lede="Everything you need to run a serious certification program. No duct tape, no spreadsheets, no chasing people down."
      >
        {#snippet title()}Go from zero to certified<br />in one afternoon.{/snippet}
      </SectionHeader>
    </BlurFade>

    <BlurFade delay={0.1} once>
      <MachineCard>
        <MachineCertificatePress
          class="h-64 md:h-80"
          label="A press stamps a certificate with an expiry date and a verification URL"
        />
      </MachineCard>
    </BlurFade>
  </div>

  <div
    class="mt-14 grid grid-cols-1 gap-0.5 overflow-hidden rounded-2xl border border-gray-800 bg-gray-800 md:mt-20 md:grid-cols-3"
  >
    {#each steps as step, i}
      <BlurFade delay={0.1 * i} once class="h-full">
        <div class="h-full bg-gray-900 p-8 transition-colors hover:bg-gray-900/80 lg:p-9">
          <div class="text-h3 mb-4 font-mono text-blue-700">
            {step.number}
          </div>
          <h3 class="text-card-title mb-2.5 font-medium text-white">{step.title}</h3>
          <p class="text-[15px] leading-relaxed text-gray-500">{step.description}</p>
        </div>
      </BlurFade>
    {/each}
  </div>
</Section>
