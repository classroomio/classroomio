<script>
  import { BlurFade } from '@cio/ui/custom/animation/blurfade';

  const deployOptions = [
    {
      icon: '🚂',
      title: 'Railway',
      description: 'One-click deploy with our Railway template. Live in under 3 minutes.',
      href: 'https://railway.app'
    },
    {
      icon: '🎨',
      title: 'Render',
      description: 'One-click Blueprint deploy on Render. Pulls our pre-built images.',
      href: 'https://render.com/deploy?repo=https://github.com/classroomio/classroomio'
    },
    {
      icon: '🐳',
      title: 'Docker Compose',
      description: 'Standard Docker setup for any Linux server or VPS. Full control.',
      href: '/github'
    },
    {
      icon: '❄️',
      title: 'Coolify',
      description: 'Self-hosted Heroku alternative. Deploy ClassroomIO alongside your stack.',
      href: 'https://coolify.io'
    }
  ];
</script>

<section id="deploy" class="bg-white px-6 py-16 lg:px-12 lg:py-24">
  <div class="mx-auto max-w-[1100px]">
    <div class="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
      <BlurFade once>
        <div>
          <div class="mb-3.5 text-xs font-medium tracking-widest text-blue-700 uppercase">Deploy to your servers</div>
          <h2 class="mb-4 text-[clamp(2rem,3vw,2.8rem)] leading-[1.15] font-medium tracking-tight">
            Your data.<br />Your servers.<br />Your call.
          </h2>
          <p class="mb-8 max-w-[520px] text-base leading-relaxed text-gray-500 lg:text-lg">
            No SaaS lock-in. No per-seat pricing surprises. Deploy ClassroomIO wherever you run your infrastructure.
            Minutes, not days.
          </p>

          <div class="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-5">
            <div class="mb-2.5 text-xs font-medium tracking-wider text-gray-500 uppercase">One-line deploy</div>
            <code class="font-mono text-sm text-gray-950">docker compose up -d</code>
          </div>
        </div>
      </BlurFade>

      <div class="flex flex-col gap-4">
        {#each deployOptions as option, i}
          <BlurFade delay={0.1 * i} once>
            <a
              href={option.href}
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-5 rounded-xl border-[1.5px] border-gray-200 p-6 text-gray-950 no-underline transition-all duration-200 hover:border-blue-700 hover:bg-blue-50"
            >
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-xl"
              >
                {option.icon}
              </div>
              <div>
                <h4 class="mb-0.5 text-sm font-medium">{option.title}</h4>
                <p class="text-sm text-gray-500">{option.description}</p>
              </div>
              <span class="ml-auto text-lg text-gray-400">→</span>
            </a>
          </BlurFade>
        {/each}
      </div>
    </div>
  </div>
</section>
