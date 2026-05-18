<script>
  import { BlurFade } from '@cio/ui/custom/animation/blurfade';
  import { DotPattern } from '@cio/ui/custom/animation/dot-pattern';

  const features = [
    {
      icon: '🏢',
      title: 'Multi-tenancy',
      description: 'Isolated environments for each department, team, or client organization.'
    },
    {
      icon: '📋',
      title: 'Audit Logs',
      description: 'Full visibility into every action, login, and change across your platform.'
    },
    {
      icon: '🔌',
      title: 'API Access',
      description: 'Programmatic control over users, courses, enrollments, and completions.'
    },
    {
      icon: '🔐',
      title: 'RBAC',
      description: 'Fine-grained roles and permissions for admins, teachers, and learners.'
    },
    {
      icon: '🔑',
      title: 'SSO / OIDC',
      description: 'Single sign-on with your identity provider. SAML and OIDC supported.'
    },
    {
      icon: '🛡️',
      title: 'SLA & Support',
      description: 'Guaranteed uptime, priority assistance, and a dedicated point of contact.'
    },
    {
      icon: '🎨',
      title: 'White Labeling',
      description: 'Fully customize the look and feel so learners only see your brand.'
    }
  ];

  const uiComponents = [
    { label: 'Button', category: 'Atom' },
    { label: 'Card', category: 'Molecule' },
    { label: 'Dialog', category: 'Molecule' },
    { label: 'Input', category: 'Atom' },
    { label: 'Badge', category: 'Atom' },
    { label: 'Table', category: 'Molecule' },
    { label: 'Tabs', category: 'Atom' },
    { label: 'Select', category: 'Atom' },
    { label: 'Sidebar', category: 'Molecule' },
    { label: 'Field', category: 'Molecule' },
    { label: 'Editor', category: 'Molecule' },
    { label: 'Accordion', category: 'Atom' }
  ];
</script>

<section class="relative overflow-hidden bg-gray-950 px-6 py-16 text-white lg:px-12 lg:py-24">
  <DotPattern
    fillColor="rgb(255 255 255 / 0.05)"
    class="absolute inset-0 h-full w-full [mask-image:radial-gradient(600px_circle_at_center,white,transparent)]"
  />

  <div class="relative z-10 mx-auto max-w-[1100px]">
    <BlurFade once>
      <div class="mb-3.5 text-xs font-medium tracking-widest text-blue-400 uppercase">Enterprise</div>
      <h2 class="mb-4 text-[clamp(2rem,3vw,2.8rem)] leading-[1.15] font-medium tracking-tight text-white">
        Enterprise-grade, out of the box.
      </h2>
      <p class="mb-6 max-w-[560px] text-base leading-relaxed text-gray-500 lg:text-lg">
        Everything in the open-source core, plus the control, security, and support that compliance teams need at scale.
      </p>

      <button
        data-cal-link="classroomio/enterprise"
        data-cal-config="'layout':'month_view'"
        class="mb-14 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-700 px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-blue-800"
      >
        Talk to us →
      </button>
    </BlurFade>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {#each features as feature, i}
        <BlurFade delay={0.08 * i} once>
          <div
            class="rounded-xl border border-white/[0.08] bg-white/[0.04] p-5 transition-all duration-200 hover:bg-white/[0.06]"
          >
            <div class="mb-3 text-2xl">{feature.icon}</div>
            <h3 class="mb-1.5 text-sm font-medium text-white">{feature.title}</h3>
            <p class="text-xs leading-relaxed text-gray-500">{feature.description}</p>
          </div>
        </BlurFade>
      {/each}
    </div>

    <!-- Composable UI -->
    <div class="mt-20">
      <BlurFade delay={0.1} once>
        <div class="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <div class="mb-3.5 text-xs font-medium tracking-widest text-blue-400 uppercase">Design System</div>
            <h3 class="mb-4 text-[clamp(1.5rem,2.5vw,2.2rem)] leading-[1.2] font-medium tracking-tight text-white">
              Composable UI.<br />Build it your way.
            </h3>
            <p class="mb-6 max-w-[480px] text-base leading-relaxed text-gray-500 lg:text-lg">
              A library of 50+ accessible, themeable components built on Svelte 5 and Tailwind. Atoms, molecules, and
              full templates you can compose into any learning experience.
            </p>

            <div class="mb-8 flex flex-wrap gap-2">
              <span
                class="rounded-full border border-white/[0.1] bg-white/[0.05] px-3 py-1 text-xs font-medium text-gray-300"
              >
                shadcn-svelte
              </span>
              <span
                class="rounded-full border border-white/[0.1] bg-white/[0.05] px-3 py-1 text-xs font-medium text-gray-300"
              >
                Tailwind v4
              </span>
              <span
                class="rounded-full border border-white/[0.1] bg-white/[0.05] px-3 py-1 text-xs font-medium text-gray-300"
              >
                Accessible
              </span>
              <span
                class="rounded-full border border-white/[0.1] bg-white/[0.05] px-3 py-1 text-xs font-medium text-gray-300"
              >
                Themeable
              </span>
            </div>

            <a
              href="https://ui.classroomio.dev"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 rounded-lg border border-white/[0.15] bg-white/[0.06] px-5 py-2.5 text-sm font-medium text-white no-underline transition-all duration-200 hover:border-blue-500/40 hover:bg-white/[0.1]"
            >
              Explore the design system
              <span class="text-blue-400">→</span>
            </a>
          </div>

          <div class="relative">
            <div class="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
              <div class="mb-5 flex items-center gap-2">
                <div class="h-3 w-3 rounded-full bg-white/[0.15]"></div>
                <div class="h-3 w-3 rounded-full bg-white/[0.1]"></div>
                <div class="h-3 w-3 rounded-full bg-white/[0.1]"></div>
                <span class="ml-2 text-xs text-gray-600">@cio/ui</span>
              </div>

              <!-- Mini component showcase -->
              <div class="space-y-4">
                <!-- Row 1: Buttons -->
                <div class="flex flex-wrap items-center gap-2">
                  <div class="rounded-md bg-blue-700 px-3 py-1.5 text-xs font-medium text-white">Primary</div>
                  <div class="rounded-md border border-white/[0.15] px-3 py-1.5 text-xs font-medium text-gray-300">
                    Outline
                  </div>
                  <div class="rounded-md bg-white/[0.08] px-3 py-1.5 text-xs font-medium text-gray-400">Ghost</div>
                  <div class="rounded-full bg-blue-500/15 px-2.5 py-0.5 text-[10px] font-medium text-blue-400">
                    Badge
                  </div>
                </div>

                <!-- Row 2: Input + Select mock -->
                <div class="flex gap-2">
                  <div
                    class="flex-1 rounded-md border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-xs text-gray-500"
                  >
                    Search courses...
                  </div>
                  <div
                    class="flex items-center gap-1 rounded-md border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-xs text-gray-500"
                  >
                    Select
                    <svg
                      class="h-3 w-3 text-gray-600"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.5"
                    >
                      <path d="M3 4.5L6 7.5L9 4.5" />
                    </svg>
                  </div>
                </div>

                <!-- Row 3: Card preview -->
                <div class="rounded-lg border border-white/[0.08] bg-white/[0.03] p-3">
                  <div class="mb-2 flex items-center gap-2">
                    <div class="h-6 w-6 rounded-full bg-blue-700/30"></div>
                    <div>
                      <div class="text-xs font-medium text-gray-300">Card Component</div>
                      <div class="text-[10px] text-gray-600">Composable header, body, footer</div>
                    </div>
                  </div>
                  <div class="flex gap-1.5">
                    <div class="h-1 flex-1 rounded-full bg-blue-700/30"></div>
                    <div class="h-1 w-8 rounded-full bg-white/[0.06]"></div>
                  </div>
                </div>

                <!-- Row 4: Toggle + Switch + Checkbox -->
                <div class="flex items-center gap-4">
                  <div class="flex items-center gap-1.5">
                    <div class="h-4 w-7 rounded-full bg-blue-700 p-0.5">
                      <div class="h-3 w-3 translate-x-3 rounded-full bg-white"></div>
                    </div>
                    <span class="text-[10px] text-gray-500">Switch</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <div class="flex h-4 w-4 items-center justify-center rounded border border-blue-700 bg-blue-700">
                      <svg class="h-2.5 w-2.5 text-white" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" stroke-width="1.5" />
                      </svg>
                    </div>
                    <span class="text-[10px] text-gray-500">Checkbox</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <div class="flex h-4 w-4 items-center justify-center rounded-full border border-blue-700">
                      <div class="h-2 w-2 rounded-full bg-blue-700"></div>
                    </div>
                    <span class="text-[10px] text-gray-500">Radio</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Component tags floating below -->
            <div class="mt-4 flex flex-wrap items-center gap-1.5">
              {#each uiComponents as comp, i}
                <BlurFade delay={0.04 * i} once>
                  <span
                    class="rounded-md border px-2 py-0.5 text-[10px] font-medium transition-colors duration-200 {comp.category ===
                    'Atom'
                      ? 'border-blue-500/20 bg-blue-500/10 text-blue-400'
                      : 'border-purple-500/20 bg-purple-500/10 text-purple-400'}"
                  >
                    {comp.label}
                  </span>
                </BlurFade>
              {/each}
              <BlurFade delay={0.04 * uiComponents.length} once>
                <span
                  class="rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-gray-500"
                >
                  +48 more
                </span>
              </BlurFade>
            </div>
          </div>
        </div>
      </BlurFade>
    </div>
  </div>
</section>
