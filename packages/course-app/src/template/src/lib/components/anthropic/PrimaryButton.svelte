<script>
  const {
    label = 'Button',
    href = '#',
    variant = 'filled',
    className = '',
    onClick = undefined
  } = $props();
</script>

{#if href}
  <a
    {href}
    class="inline-block rounded-md px-5 py-2 text-base font-semibold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 {variant ===
    'filled'
      ? 'bg-black text-white hover:bg-[#FF6F3C]'
      : 'border-2 border-black bg-white text-black hover:bg-[#FF6F3C] hover:text-white'} {className}"
    on:click={onClick}
  >
    {label}
  </a>
{:else}
  <button
    class="rounded-md px-5 py-2 text-base font-semibold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 {variant ===
    'filled'
      ? 'bg-black text-white hover:bg-[#FF6F3C]'
      : 'border-2 border-black bg-white text-black hover:bg-[#FF6F3C] hover:text-white'} {className}"
    on:click={onClick}
  >
    {label}
  </button>
{/if}
