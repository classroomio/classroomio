<script>
  const {
    menuItems = [
      { label: 'Claude', href: '#' },
      { label: 'API', href: '#' },
      { label: 'Solutions', href: '#' },
      { label: 'Research', href: '#' },
      { label: 'Commitments', href: '#' },
      { label: 'Learn', href: '#' },
      { label: 'News', href: '#' }
    ]
  } = $props();
</script>

<nav
  class="flex w-full items-center justify-between border-b border-[#E6E1DC] bg-[#FAF8F6] px-8 py-6 font-sans"
>
  <div class="flex items-center gap-2">
    <span class="text-xl font-black tracking-tight text-black">ANTHROPIC</span>
  </div>
  <div class="hidden items-center gap-8 text-[1rem] font-medium text-black md:flex">
    {#each menuItems as item}
      <a href={item.href} class="transition-colors hover:underline">{item.label}</a>
    {/each}
    <a
      href="#"
      class="ml-4 rounded-md bg-black px-5 py-2 font-semibold text-white transition-colors hover:bg-[#FF6F3C]"
      >Try Claude</a
    >
  </div>
  <div class="md:hidden">
    <!-- Mobile menu icon placeholder -->
    <button aria-label="Open menu">
      <svg
        width="24"
        height="24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" /></svg
      >
    </button>
  </div>
</nav>
