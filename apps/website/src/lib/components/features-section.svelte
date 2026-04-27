<script>
  import { BlurFade } from '@cio/ui/custom/animation/blurfade';
  import Palette from '@lucide/svelte/icons/palette';
  import Globe from '@lucide/svelte/icons/globe';
  import Code2 from '@lucide/svelte/icons/code-2';
  import Settings2 from '@lucide/svelte/icons/settings-2';

  const features = [
    {
      Icon: Palette,
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-600',
      title: 'Full Theming',
      description: 'Pick the colors, fonts, and logo. Your brand shows up everywhere your learners look.',
      tags: ['Custom colors', 'Logo upload', 'Font control']
    },
    {
      Icon: Globe,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      title: 'Custom Domain',
      description:
        'Host the LMS on learn.yourcompany.com with SSL included. No ClassroomIO branding anywhere on the page.',
      tags: ['SSL included', 'White label', 'DNS setup guide']
    },
    {
      Icon: Code2,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
      title: 'Embed courses on your site',
      description:
        'Add one script tag to any page. Your courses render right there and send learners back to your LMS to enroll.',
      tags: ['One-line script', 'Auto-styled', 'Links to your domain']
    },
    {
      Icon: Settings2,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      title: 'Deep LMS Customization',
      description:
        'The codebase is modern and readable. Your developers can change anything without fighting a plugin system.',
      tags: ['Modern stack', 'Clean codebase', 'Extensible']
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
            <div
              class="mb-5 flex h-12 w-12 items-center justify-center rounded-xl {feature.iconBg} {feature.iconColor}"
            >
              <feature.Icon class="h-6 w-6" strokeWidth={1.75} />
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
