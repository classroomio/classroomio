<script lang="ts">
  import { BlurFade } from '@cio/ui/custom/animation/blurfade';
  import Lock from '@lucide/svelte/icons/lock';
  import { onDestroy } from 'svelte';

  const ROTATION_INTERVAL_MS = 3000;
  let selectedTheme = $state('blue');
  let intervalId = $state<NodeJS.Timeout | null>(null);

  const themes = [
    { id: 'blue', color: '#1d4ee2', bgClass: 'bg-blue-700/20', activeBorder: 'border-[#1d4ee2]' },
    { id: 'rose', color: '#be1241', bgClass: 'bg-red-600/20', activeBorder: 'border-[#be1241]' },
    { id: 'green', color: '#0c891b', bgClass: 'bg-green-600/20', activeBorder: 'border-[#0c891b]' },
    { id: 'orange', color: '#cc4902', bgClass: 'bg-orange-600/20', activeBorder: 'border-[#cc4902]' },
    { id: 'purple', color: '#9333ea', bgClass: 'bg-purple-600/20', activeBorder: 'border-purple-600' }
  ];

  function startRotation() {
    if (intervalId) return;

    intervalId = setInterval(() => {
      const currentIndex = themes.findIndex((t) => t.id === selectedTheme);
      const nextIndex = (currentIndex + 1) % themes.length;
      selectedTheme = themes[nextIndex].id;
    }, ROTATION_INTERVAL_MS);
  }

  function stopRotation() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function selectTheme(themeId: string) {
    selectedTheme = themeId;
    stopRotation();
  }

  startRotation();

  onDestroy(() => {
    stopRotation();
  });
</script>

<section class="bg-[#f5f4f0] px-6 py-12 lg:px-12 lg:py-16">
  <div class="mx-auto max-w-[1100px]">
    <BlurFade once>
      <h2
        class="max-w-[820px] text-[clamp(1.75rem,2.8vw,2.4rem)] leading-[1.1] font-medium tracking-tight text-gray-950"
      >
        Make it yours,<br />down to the favicon.
      </h2>
      <p class="mt-3 max-w-[620px] text-sm leading-relaxed text-gray-500">
        Your brand, your domain, your content. ClassroomIO bends to fit the academy you want to ship.
      </p>
    </BlurFade>

    <div class="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
      <!-- Theme + branding -->
      <BlurFade delay={0.05} once>
        <div
          class="flex h-full flex-col rounded-2xl border border-gray-200/80 p-6 transition-colors duration-500 lg:p-7 {themes.find(
            (t) => t.id === selectedTheme
          )?.bgClass}"
        >
          <h3 class="text-base font-medium tracking-tight text-gray-950 lg:text-lg">Theme everything</h3>
          <p class="mt-2 max-w-[420px] text-sm leading-relaxed text-gray-500">
            Pick a theme color or drop in your own hex. Every page picks it up.
          </p>

          <!-- Visual: actual theme swatches from the app -->
          <div class="mt-8 flex flex-1 flex-col justify-end">
            <div class="flex flex-wrap items-center gap-2.5">
              {#each themes as theme (theme.id)}
                <button
                  type="button"
                  class="flex size-8 cursor-pointer items-center justify-center rounded-full border-2 bg-white transition-all {selectedTheme ===
                  theme.id
                    ? theme.activeBorder
                    : 'border-transparent'}"
                  aria-label="{theme.id} theme"
                  onclick={() => selectTheme(theme.id)}
                >
                  <span class="size-5 rounded-full" style="background-color: {theme.color}"></span>
                </button>
              {/each}
              <div
                class="flex h-9 w-9 items-center justify-center rounded-full border-2 border-dashed border-gray-400 text-gray-500"
                aria-label="Custom hex"
              >
                +
              </div>
            </div>
          </div>
        </div>
      </BlurFade>

      <!-- Custom domain -->
      <BlurFade delay={0.1} once>
        <div class="flex h-full flex-col rounded-2xl border border-gray-200/80 bg-[#ecebe6] p-6 lg:p-7">
          <h3 class="text-base font-medium tracking-tight text-gray-950 lg:text-lg">Your domain</h3>
          <p class="mt-2 max-w-[420px] text-sm leading-relaxed text-gray-500">
            Map a CNAME, click verify. SSL is handled. No ClassroomIO branding on the page.
          </p>

          <!-- Visual: browser bar mock -->
          <div class="mt-8 flex flex-1 flex-col justify-end">
            <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div class="flex items-center gap-2 border-b border-gray-100 bg-white px-3 py-2.5">
                <div class="h-2 w-2 rounded-full bg-red-400"></div>
                <div class="h-2 w-2 rounded-full bg-yellow-400"></div>
                <div class="h-2 w-2 rounded-full bg-green-500"></div>
                <div
                  class="ml-2 flex flex-1 items-center gap-1.5 rounded-md bg-gray-50 px-2.5 py-1 text-[11px] text-gray-600"
                >
                  <Lock size={10} class="text-green-600" />
                  <span class="font-mono">learn.acme.com</span>
                </div>
              </div>
              <div class="grid grid-cols-3 gap-1.5 p-3">
                <div class="h-12 rounded-md bg-gradient-to-br from-blue-200 to-blue-400"></div>
                <div class="h-12 rounded-md bg-gradient-to-br from-indigo-200 to-blue-500"></div>
                <div class="h-12 rounded-md bg-gradient-to-br from-sky-200 to-cyan-400"></div>
              </div>
            </div>
          </div>
        </div>
      </BlurFade>

      <!-- Embed -->
      <BlurFade delay={0.15} once>
        <div class="flex h-full flex-col rounded-2xl border border-gray-200/80 bg-[#ecebe6] p-6 lg:p-7">
          <h3 class="text-base font-medium tracking-tight text-gray-950 lg:text-lg">Embed anywhere</h3>
          <p class="mt-2 max-w-[420px] text-sm leading-relaxed text-gray-500">
            One script tag. Drop courses into your help center, in-product, or marketing site.
          </p>

          <!-- Visual: code snippet -->
          <div class="mt-8 flex flex-1 flex-col justify-end">
            <div
              class="overflow-hidden rounded-xl border border-gray-800/90 bg-gray-950 p-4 font-mono text-[11px] leading-relaxed text-gray-300 shadow-sm"
            >
              <p class="text-gray-500">&lt;!-- in your help center --&gt;</p>
              <p class="mt-1.5">
                <span class="text-pink-400">&lt;script</span>
                <span class="text-sky-300"> src</span>=<span class="text-emerald-300">"cdn.cio/widget.js"</span><span
                  class="text-pink-400">&gt;&lt;/script&gt;</span
                >
              </p>
              <p class="mt-1.5">
                <span class="text-pink-400">&lt;div</span>
                <span class="text-sky-300"> data-cio-widget</span>=<span class="text-emerald-300">"onboarding"</span
                ><span class="text-pink-400">&gt;&lt;/div&gt;</span>
              </p>
            </div>
          </div>
        </div>
      </BlurFade>

      <!-- Open source / deep customization -->
      <BlurFade delay={0.2} once>
        <div class="flex h-full flex-col rounded-2xl border border-gray-200/80 bg-[#ecebe6] p-6 lg:p-7">
          <h3 class="text-base font-medium tracking-tight text-gray-950 lg:text-lg">Fork the codebase</h3>
          <p class="mt-2 max-w-[420px] text-sm leading-relaxed text-gray-500">
            Modern stack, readable codebase, AGPL on GitHub. Change whatever you need.
          </p>

          <!-- Visual: stylised file tree / stack -->
          <div class="mt-8 flex flex-1 flex-col justify-end">
            <div class="space-y-1.5">
              <div
                class="flex items-center gap-2 rounded-md bg-white/70 px-3 py-2 text-[11px] font-medium text-gray-700 ring-1 ring-gray-200"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                <span class="font-mono">apps/dashboard</span>
                <span class="ml-auto text-gray-400">Svelte 5</span>
              </div>
              <div
                class="flex items-center gap-2 rounded-md bg-white/70 px-3 py-2 text-[11px] font-medium text-gray-700 ring-1 ring-gray-200"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                <span class="font-mono">apps/api</span>
                <span class="ml-auto text-gray-400">Hono · Drizzle</span>
              </div>
              <div
                class="flex items-center gap-2 rounded-md bg-white/70 px-3 py-2 text-[11px] font-medium text-gray-700 ring-1 ring-gray-200"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-fuchsia-500"></span>
                <span class="font-mono">packages/ai-assistant</span>
                <span class="ml-auto text-gray-400">Claude</span>
              </div>
              <div
                class="flex items-center gap-2 rounded-md bg-white/70 px-3 py-2 text-[11px] font-medium text-gray-700 ring-1 ring-gray-200"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                <span class="font-mono">packages/mcp</span>
                <span class="ml-auto text-gray-400">MCP</span>
              </div>
            </div>
          </div>
        </div>
      </BlurFade>
    </div>
  </div>
</section>
