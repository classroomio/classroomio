<script>
  import { BlurFade } from '@cio/ui/custom/animation/blurfade';
  import { BorderBeam } from '@cio/ui/custom/animation/border-beam';
  import { Badge } from '@cio/ui/base/badge';
</script>

<section class="px-6 pt-32 pb-16 lg:px-12 lg:pt-40 lg:pb-24">
  <div class="mx-auto grid max-w-[1100px] grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
    <div>
      <BlurFade delay={0} once>
        <a href="/blog/learn-from-the-best" class="mb-7 inline-block">
          <Badge variant="secondary" class="gap-2! px-3.5! py-1.5! text-xs! underline!">
            <span class="relative flex h-2 w-2">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
              <span class="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
            </span>
            Introducing ClassroomIO Version 2 →
          </Badge>
        </a>
      </BlurFade>

      <BlurFade delay={0.1} once>
        <h1 class="mb-6 text-[clamp(2.4rem,4vw,3.4rem)] leading-[1.12] font-medium tracking-tight text-gray-950">
          Nail your compliance training and your
          <em class="text-blue-700 not-italic">certification program.</em>
        </h1>
      </BlurFade>

      <BlurFade delay={0.2} once>
        <p class="mb-9 max-w-[480px] text-base leading-relaxed text-gray-500 lg:text-lg">
          ClassroomIO is the open source LMS built for compliance-driven teams. Run your certification programs, track
          completions, and prove training happened. No Moodle headaches.
        </p>
      </BlurFade>

      <BlurFade delay={0.3} once>
        <div class="flex flex-wrap items-center gap-3.5">
          <a
            href="/signup"
            class="inline-flex items-center gap-2 rounded-lg bg-gray-950 px-7 py-3.5 text-sm font-medium text-white no-underline transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 lg:text-base"
          >
            Get Started Free →
          </a>
          <button
            data-cal-link="classroomio/demo"
            data-cal-config="'layout':'month_view'"
            class="cursor-pointer rounded-lg border-[1.5px] border-gray-200 bg-transparent px-7 py-3.5 text-sm font-medium text-gray-950 transition-all duration-200 hover:border-gray-950 lg:text-base"
          >
            Book a Demo
          </button>
        </div>
      </BlurFade>

      <BlurFade delay={0.4} once>
        <div class="mt-7 flex flex-wrap items-center gap-5 text-xs text-gray-500">
          <span class="flex items-center gap-1.5">
            <span class="font-medium text-blue-700">✓</span> Open source
          </span>
          <span class="flex items-center gap-1.5">
            <span class="font-medium text-blue-700">✓</span> Self-hosted
          </span>
          <span class="flex items-center gap-1.5">
            <span class="font-medium text-blue-700">✓</span> No per-seat fees
          </span>
        </div>
      </BlurFade>
    </div>

    <!-- Hero Visual -->
    <BlurFade delay={0.2} once>
      <div class="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 shadow-2xl/5">
        <BorderBeam size={250} duration={12} colorFrom="#0233BD" colorTo="#6b8fff" delay={1} />
        <div class="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3.5">
          <div class="h-2.5 w-2.5 rounded-full bg-red-400"></div>
          <div class="h-2.5 w-2.5 rounded-full bg-yellow-400"></div>
          <div class="h-2.5 w-2.5 rounded-full bg-green-500"></div>
        </div>
        <div class="p-6">
          <div class="mb-3.5 text-xs font-medium tracking-wider text-gray-500 uppercase">Team Progress - This Week</div>

          <div class="mb-3 flex items-center gap-3.5 rounded-xl border border-gray-200 bg-white p-4">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-lg">📋</div>
            <div class="min-w-0 flex-1">
              <div class="mb-1 text-sm font-medium">Annual Compliance Training</div>
              <div class="h-1 overflow-hidden rounded-full bg-gray-200">
                <div class="h-full rounded-full bg-blue-700" style="width: 85%"></div>
              </div>
            </div>
            <div
              class="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[0.7rem] font-medium whitespace-nowrap text-blue-700"
            >
              85%
            </div>
          </div>

          <div class="mb-3 flex items-center gap-3.5 rounded-xl border border-gray-200 bg-white p-4">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-50 text-lg">🛡️</div>
            <div class="min-w-0 flex-1">
              <div class="mb-1 text-sm font-medium">Security & Compliance</div>
              <div class="h-1 overflow-hidden rounded-full bg-gray-200">
                <div class="h-full rounded-full bg-green-500" style="width: 100%"></div>
              </div>
            </div>
            <div
              class="shrink-0 rounded-full bg-green-50 px-2 py-0.5 text-[0.7rem] font-medium whitespace-nowrap text-green-600"
            >
              ✓ Done
            </div>
          </div>

          <div class="mb-3 flex items-center gap-3.5 rounded-xl border border-gray-200 bg-white p-4">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-lg">🎯</div>
            <div class="min-w-0 flex-1">
              <div class="mb-1 text-sm font-medium">Product Certification</div>
              <div class="h-1 overflow-hidden rounded-full bg-gray-200">
                <div class="h-full rounded-full bg-blue-700" style="width: 42%"></div>
              </div>
            </div>
            <div
              class="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[0.7rem] font-medium whitespace-nowrap text-blue-700"
            >
              42%
            </div>
          </div>

          <div class="mt-4 flex items-center gap-3 rounded-lg bg-blue-50 p-4">
            <span class="text-xl">🏆</span>
            <div>
              <div class="text-sm font-medium">3 certificates issued today</div>
              <div class="text-xs text-gray-500">Sarah, Marcus & Priya completed their certs</div>
            </div>
          </div>
        </div>
      </div>
    </BlurFade>
  </div>
</section>
