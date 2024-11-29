<script>
  export let className = '';
</script>

<header
  class="hero-bg lg:min-h-[20rem] mt-[10%] md:mt-16 pt-24 pb-16 w-full border-b border-slate-100 dark:border-gray-800 {className}"
>
  <slot />
</header>
