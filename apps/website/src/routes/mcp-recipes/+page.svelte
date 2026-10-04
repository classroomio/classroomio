<script lang="ts">
  import { HeroSubtitle, McpServerSection, PageHeader, PageSignupCTA } from '$lib/components';
  import { CtaButton, Section, SectionHeader } from '$lib/components/ui';
  import { Badge } from '@cio/ui/base/badge';
  import Sparkles from '@lucide/svelte/icons/sparkles';
  import Copy from '@lucide/svelte/icons/copy';
  import Check from '@lucide/svelte/icons/check';

  type Recipe = {
    eyebrow: string;
    title: string;
    description: string;
    prompt: string;
  };

  const recipes: Recipe[] = [
    {
      eyebrow: '01 · Authoring',
      title: 'Generate a customer onboarding course from a doc URL',
      description:
        'The agent plans the course, drafts every lesson, and writes the quiz questions, then waits for your approval before publishing.',
      prompt:
        'Generate a customer onboarding course from https://docs.acme.com/getting-started. Use the "Customer Onboarding" template. Plan the course first, then wait for my approval before implementing the lessons.'
    },
    {
      eyebrow: '02 · Refresh',
      title: 'Refresh a compliance course after a policy update',
      description:
        'When the policy changes, the agent identifies the affected lessons and drafts the revisions for your review.',
      prompt:
        'Open the "Annual Security Training" course. Fetch the new policy at https://wiki.acme.com/security/soc2. Update any lessons whose content is contradicted by the policy, tag the course with "needs-review", and report what you changed.'
    },
    {
      eyebrow: '03 · Launches',
      title: 'Tag every course tied to a new product launch',
      description: 'Bulk-tag drafts and published courses so you can filter, assign, or report on them in one query.',
      prompt:
        'Find every course in my org whose title or description mentions the v3.2 API. Apply the tag "launch-v3.2" to all of them and tell me how many you tagged.'
    },
    {
      eyebrow: '04 · Quiz authoring',
      title: 'Add quiz questions to an existing lesson',
      description:
        'The agent reads the lesson body and generates assessment questions you can review before publishing.',
      prompt:
        'In the "Acme 101" course, find the "Connecting your data source" lesson. Add an exercise to it with 5 quiz questions covering the key concepts in the lesson body. Use a mix of multiple choice and short answer.'
    },
    {
      eyebrow: '05 · Reorganise',
      title: 'Reorder lessons inside a course',
      description: 'Tell the agent what order matters; it reorders sections and lessons without touching the content.',
      prompt:
        'In the "Admin Bootcamp" course, move the "SSO setup" section before "Inviting your team". Keep all other ordering as-is. Show me the new structure before applying.'
    },
    {
      eyebrow: '06 · Review',
      title: 'Audit every draft before publish',
      description:
        'Get a written summary of what each draft is missing: landing page, quiz questions, certificate rule, or final exam.',
      prompt:
        'List every draft course in my org. For each one, fetch its structure and tell me what is still missing before it can go live (e.g. landing page copy, final exam, certificate rule, lessons without exercises).'
    }
  ];

  let copiedIndex = $state<number | null>(null);

  async function copyPrompt(index: number, prompt: string) {
    try {
      await navigator.clipboard.writeText(prompt);
      copiedIndex = index;
      setTimeout(() => {
        if (copiedIndex === index) copiedIndex = null;
      }, 1800);
    } catch (e) {
      console.error('Copy failed', e);
    }
  }
</script>

<section class="bg-white">
  <PageHeader className="px-6 md:px-10">
    <div class="max-w-content mx-auto">
      <Badge variant="outline" class="mb-6 gap-2! bg-white px-3.5! py-1.5!">
        <Sparkles size={14} class="text-blue-700" />
        MCP recipes
      </Badge>

      <h1 class="text-display max-w-[1000px] text-balance text-gray-950">
        Let your agent
        <em class="text-blue-700 not-italic">keep your courses up to date.</em>
      </h1>

      <HeroSubtitle>
        Plug the ClassroomIO MCP server into Cursor, Claude Code, Codex, or OpenCode. Then paste one of these prompts.
        The agent plans the work, waits for your approval, and runs it.
      </HeroSubtitle>

      <div class="mt-9 flex flex-wrap items-center gap-3">
        <CtaButton href="/signup">Get an MCP key</CtaButton>
        <CtaButton href="/automation" variant="secondary">Read the docs</CtaButton>
      </div>
    </div>
  </PageHeader>

  <Section class="bg-white">
    <SectionHeader eyebrow="Recipes" eyebrowClass="text-blue-700" titleClass="" class="mb-12 md:mb-16">
      {#snippet title()}Paste a prompt. Get the result.{/snippet}
    </SectionHeader>

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
      {#each recipes as recipe, i}
        <div
          class="group flex flex-col rounded-xl border border-gray-200 bg-white p-6 transition-colors hover:border-blue-700 lg:p-7"
        >
          <p class="text-label font-mono text-blue-700 uppercase">{recipe.eyebrow}</p>
          <h3 class="text-card-title mt-3 font-medium text-gray-950">{recipe.title}</h3>
          <p class="mt-2 text-[15px] leading-relaxed text-gray-500">{recipe.description}</p>

          <div class="relative mt-6 overflow-hidden rounded-md border border-gray-200 bg-gray-50 lg:mt-auto">
            <div class="flex items-center justify-between border-b border-gray-200 bg-white px-3 py-2">
              <span class="cio-code-font text-[10px] tracking-widest text-gray-500 uppercase">Prompt</span>
              <button
                type="button"
                onclick={() => copyPrompt(i, recipe.prompt)}
                class="cio-code-font inline-flex cursor-pointer items-center gap-1.5 rounded-xs px-2 py-1 text-[11px] font-medium tracking-wide opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 focus:opacity-100 {copiedIndex ===
                i
                  ? 'bg-emerald-50 text-emerald-700 opacity-100! ring-1 ring-emerald-200'
                  : 'bg-blue-50 text-blue-700 ring-1 ring-blue-100 hover:bg-blue-100'}"
                aria-label="Copy prompt"
              >
                {#if copiedIndex === i}
                  <Check size={12} strokeWidth={2.5} />
                  Copied
                {:else}
                  <Copy size={12} strokeWidth={2} />
                  Copy
                {/if}
              </button>
            </div>
            <pre
              class="cio-code-font overflow-x-auto px-4 py-3.5 text-[12.5px] leading-[1.6] break-words whitespace-pre-wrap text-gray-800">{recipe.prompt}</pre>
          </div>
        </div>
      {/each}
    </div>
  </Section>

  <McpServerSection
    eyebrow="Setup"
    title="Two minutes to wire it up."
    description="Drop this into your agent's MCP config, restart the client, and you're ready to run any of the recipes above."
    showTools={false}
  />

  <PageSignupCTA
    header="One prompt away from a real course."
    subText="Spin up a free workspace, paste a recipe, and watch your agent build it."
    btnLabel="Get started free"
  />
</section>

<style>
  .cio-code-font,
  :global(.cio-code-font *) {
    font-family: var(--font-mono);
    font-feature-settings:
      'liga' 0,
      'calt' 0;
    font-variant-ligatures: none;
    letter-spacing: 0;
  }
</style>
