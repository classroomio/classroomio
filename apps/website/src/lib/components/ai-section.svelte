<script>
  import { BlurFade } from '@cio/ui/custom/animation/blurfade';
  import { BorderBeam } from '@cio/ui/custom/animation/border-beam';

  const aiFeatures = [
    {
      icon: '⚡',
      title: 'Create a full course in seconds',
      description:
        'Tell your agent what to build. It creates the course, writes the lessons, and adds quizzes. What used to take days now takes seconds.'
    },
    {
      icon: '🔄',
      title: 'Update content instantly',
      description:
        'Policies changed? Tell your agent to update the course. It rewrites the affected lessons and adjusts the quiz questions to match.'
    },
    {
      icon: '📄',
      title: 'Turn any doc into training',
      description:
        'Point your agent at a Notion page, Google Doc, or PDF. It reads the source and builds a structured course with assessments.'
    }
  ];

  const agents = [
    { name: 'Cursor', logo: '/cursor-logo.png' },
    { name: 'Claude Code', logo: '/claude-logo.svg' },
    { name: 'Codex', logo: '/codex-logo.png' },
    { name: 'OpenCode', logo: '/opencode-logo.svg' }
  ];
</script>

<section
  id="ai"
  class="relative overflow-hidden bg-linear-to-br from-gray-950 to-[#0f1629] px-6 py-16 text-white lg:px-12 lg:py-24"
>
  <div
    class="pointer-events-none absolute -top-[200px] -right-[200px] h-[600px] w-[600px] bg-[radial-gradient(circle,rgba(2,51,189,0.15)_0%,transparent_70%)]"
  ></div>

  <div class="mx-auto max-w-[1100px]">
    <div class="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
      <div>
        <BlurFade once>
          <div class="mb-3.5 text-xs font-medium tracking-widest text-blue-400 uppercase">AI-Powered Content</div>
          <h2 class="mb-4 text-[clamp(2rem,3vw,2.8rem)] leading-[1.15] font-medium tracking-tight text-white">
            Let your agent do<br />the course building.
          </h2>
          <p class="mb-14 max-w-[520px] text-base leading-relaxed text-gray-500 lg:text-lg">
            Connect your favorite AI agent to ClassroomIO via MCP. Create, update, and publish entire courses from your
            terminal in seconds.
          </p>
        </BlurFade>

        <div class="flex flex-col gap-6">
          {#each aiFeatures as feature, i}
            <BlurFade delay={0.15 * i} once>
              <div class="flex items-start gap-4 rounded-xl border border-white/[0.08] bg-white/[0.04] p-6">
                <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-700/20 text-2xl">
                  {feature.icon}
                </div>
                <div>
                  <h4 class="mb-1.5 text-sm font-medium text-white">{feature.title}</h4>
                  <p class="text-sm leading-relaxed text-gray-500">{feature.description}</p>
                </div>
              </div>
            </BlurFade>
          {/each}
        </div>
      </div>

      <BlurFade delay={0.2} once>
        <div>
          <!-- Code Block -->
          <div class="relative overflow-hidden rounded-2xl border border-gray-800 bg-[#0d0d0d]">
            <BorderBeam size={200} duration={10} colorFrom="#0233BD" colorTo="#6b8fff" />
            <div class="flex items-center gap-2 border-b border-gray-800 bg-gray-900 px-5 py-3.5">
              <div class="h-2.5 w-2.5 rounded-full bg-red-400"></div>
              <div class="h-2.5 w-2.5 rounded-full bg-yellow-400"></div>
              <div class="h-2.5 w-2.5 rounded-full bg-green-500"></div>
              <span class="ml-2 text-xs text-gray-600">mcp.json</span>
            </div>
            <div class="p-6 font-mono text-xs leading-loose whitespace-pre text-gray-400 lg:text-sm">
              {'{'}<br />{'    '}<span class="text-blue-400">"mcpServers"</span>: {'{'}<br />{'        '}<span
                class="text-blue-400">"classroomio"</span
              >: {'{'}<br />{'            '}<span class="text-blue-400">"command"</span>:
              <span class="text-green-400">"npx"</span>,<br />{'            '}<span class="text-blue-400">"args"</span>:
              [<span class="text-green-400">"-y"</span>, <span class="text-green-400">"@classroomio/mcp"</span>],<br
              />{'            '}<span class="text-blue-400">"env"</span>: {'{'}<br />{'                '}<span
                class="text-blue-400">"CLASSROOMIO_API_URL"</span
              >: <span class="text-green-400">"https://api.classroomio.com"</span>,<br />{'                '}<span
                class="text-blue-400">"CLASSROOMIO_API_KEY"</span
              >: <span class="text-green-400">"&lt;your-mcp-key&gt;"</span><br />{'            }'}<br />{'        }'}<br
              />{'    }'}<br />{'}'}
            </div>
          </div>

          <!-- Supported Agents -->
          <div class="mt-6">
            <div class="mb-3 text-xs tracking-wider text-gray-600 uppercase">Works with</div>
            <div class="flex flex-wrap gap-3">
              {#each agents as agent}
                <div
                  class="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.06] px-3.5 py-2"
                >
                  <img src={agent.logo} alt="{agent.name} logo" class="h-5 w-5 rounded-full" />
                  <span class="text-xs text-gray-300">{agent.name}</span>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </BlurFade>
    </div>
  </div>
</section>
