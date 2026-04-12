<script>
  import { BlurFade } from '@cio/ui/custom/animation/blurfade';

  const features = [
    {
      icon: '🎨',
      title: 'Full Theming',
      description:
        "Match your brand exactly. Custom colors, fonts, logos, and layouts. Your learners will never know it's ClassroomIO under the hood.",
      tags: ['Custom colors', 'Logo upload', 'Font control']
    },
    {
      icon: '🌐',
      title: 'Custom Domain',
      description:
        'Serve your LMS from learn.yourcompany.com. Full SSL, zero ClassroomIO branding. Just your platform, your way.',
      tags: ['SSL included', 'White label', 'DNS setup guide']
    },
    {
      icon: '⚙️',
      title: 'Deep LMS Customization',
      description:
        'Modern codebase means any developer can go in and change anything. No Moodle plugin archaeology. No undocumented hacks.',
      tags: ['Modern stack', 'Clean codebase', 'Extensible']
    },
    {
      icon: '📊',
      title: 'Manager Dashboards',
      description:
        'See exactly where your team stands. Completion rates, overdue courses, certificate expiry dates, all in one view and exportable to CSV.',
      tags: ['Team views', 'CSV export', 'Audit logs']
    }
  ];
</script>

<section class="bg-gray-50 px-6 py-16 lg:px-12 lg:py-24">
  <div class="mx-auto max-w-[1100px]">
    <BlurFade once>
      <div class="mb-3.5 text-xs font-medium tracking-widest text-blue-700 uppercase">Make it yours</div>
      <h2 class="mb-4 text-[clamp(2rem,3vw,2.8rem)] leading-[1.15] font-medium tracking-tight">
        Your brand.<br />Your domain. Your rules.
      </h2>
      <p class="mb-14 max-w-[520px] text-base leading-relaxed text-gray-500 lg:text-lg">
        ClassroomIO bends to fit your organization, not the other way around.
      </p>
    </BlurFade>

    <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
      {#each features as feature, i}
        <BlurFade delay={0.1 * i} once>
          <div class="rounded-2xl border border-gray-200 bg-white p-8 lg:p-9">
            <div class="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
              {feature.icon}
            </div>
            <h3 class="mb-2.5 text-xl font-medium tracking-tight">{feature.title}</h3>
            <p class="mb-5 text-sm leading-relaxed text-gray-500">{feature.description}</p>
            <div class="flex flex-wrap gap-2">
              {#each feature.tags as tag}
                <span
                  class="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-500"
                >
                  {tag}
                </span>
              {/each}
            </div>
          </div>
        </BlurFade>
      {/each}
    </div>
  </div>
</section>
