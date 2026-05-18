<script>
  /**
   * @typedef {Object} Props
   * @property {string} fileName             Filename shown in chrome (e.g. "mcp.json")
   * @property {string[]} codeLines          HTML-formatted source lines (one entry per visual line)
   * @property {string} [lang]               Optional language badge (e.g. "JSON", "HTML", "TypeScript")
   * @property {string} [statusBar]          Optional status bar text
   * @property {boolean} [copyable]          Show a Copy button (default true)
   * @property {boolean} [showLineNumbers]   Show line-number gutter (default false)
   * @property {string} [class]              Extra wrapper classes
   */

  /** @type {Props} */
  let {
    fileName,
    codeLines,
    lang = '',
    statusBar = '',
    copyable = true,
    showLineNumbers = false,
    class: className = ''
  } = $props();
</script>

<div
  class="relative overflow-hidden rounded-2xl bg-[#0d1117] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] ring-1 ring-white/[0.08] {className}"
>
  <!-- Editor chrome -->
  <div class="flex items-center justify-between border-b border-white/[0.06] bg-[#0a0e14] px-4 py-3">
    <div class="flex items-center gap-2">
      <div class="h-2.5 w-2.5 rounded-full bg-[#ff5f57]"></div>
      <div class="h-2.5 w-2.5 rounded-full bg-[#febc2e]"></div>
      <div class="h-2.5 w-2.5 rounded-full bg-[#28c840]"></div>
      <span class="cio-code-font ml-3 text-[12px] text-slate-500">{fileName}</span>
    </div>
    <div class="flex items-center gap-2">
      {#if lang}
        <span
          class="cio-code-font rounded-md bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium tracking-wider text-slate-400 uppercase"
          >{lang}</span
        >
      {/if}
      {#if copyable}
        <span
          class="cio-code-font cursor-pointer rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium tracking-wide text-blue-300 ring-1 ring-blue-500/20 transition-colors hover:bg-blue-500/15"
          >Copy</span
        >
      {/if}
    </div>
  </div>

  <!-- Body -->
  <div class="cio-code-font flex text-[13px] leading-[1.6] text-slate-300">
    {#if showLineNumbers}
      <div class="py-5 pr-3 pl-5 text-right text-slate-600 tabular-nums select-none">
        {#each codeLines as _, n}
          <div>{n + 1}</div>
        {/each}
      </div>
    {/if}
    <div class="flex-1 overflow-x-auto whitespace-pre {showLineNumbers ? 'pr-5' : 'px-5'} py-5">
      {#each codeLines as line}
        <div>{@html line || ' '}</div>
      {/each}
    </div>
  </div>

  {#if statusBar}
    <div class="cio-code-font border-t border-white/[0.06] bg-black/40 px-4 py-2 text-[10.5px] text-slate-500">
      <span class="text-blue-300">●</span>
      {statusBar}
    </div>
  {/if}
</div>

<style>
  /* JetBrains Mono loaded via the Google Fonts link in src/app.html. System stack as fallback. */
  /* :global(...*) forces the font onto every descendant — including {@html}-rendered
     spans that don't carry Svelte's scope hash, and overrides any stray universal rules. */
  .cio-code-font,
  :global(.cio-code-font *) {
    font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace;
    font-feature-settings:
      'liga' 0,
      'calt' 0;
    font-variant-ligatures: none;
    letter-spacing: 0;
  }
</style>
