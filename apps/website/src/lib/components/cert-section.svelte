<script>
  import { BlurFade } from '@cio/ui/custom/animation/blurfade';
  import { Meteors } from '@cio/ui/custom/animation/meteors';

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

<section id="features" class="bg-gray-950 px-6 py-16 text-white lg:px-12 lg:py-24">
  <div class="mx-auto max-w-[1100px]">
    <BlurFade once>
      <div class="mb-3.5 text-xs font-medium tracking-widest text-blue-400 uppercase">Certifications & Compliance</div>
      <h2 class="mb-4 text-[clamp(2rem,3vw,2.8rem)] leading-[1.15] font-medium tracking-tight text-white">
        Go from zero to certified<br />in one afternoon.
      </h2>
      <p class="mb-14 max-w-[520px] text-base leading-relaxed text-gray-500 lg:text-lg">
        Everything you need to run a serious certification program. No duct tape, no spreadsheets, no chasing people
        down.
      </p>
    </BlurFade>

    <div class="grid grid-cols-1 gap-0.5 overflow-hidden rounded-2xl border border-gray-800 bg-gray-800 md:grid-cols-3">
      {#each steps as step, i}
        <BlurFade delay={0.1 * i} once>
          <div
            class="relative overflow-hidden bg-gray-900 p-8 transition-colors duration-200 hover:bg-gray-900/80 lg:p-9"
          >
            <Meteors number={6} />
            <div class="mb-3.5 text-[2.8rem] leading-none font-medium text-blue-700 italic">
              {step.number}
            </div>
            <h3 class="mb-2.5 text-base font-medium text-white">{step.title}</h3>
            <p class="text-sm leading-relaxed text-gray-500">{step.description}</p>
          </div>
        </BlurFade>
      {/each}
    </div>
  </div>
</section>
