<script>
  import { ArrowRight, ArrowUpRight, Close } from 'carbon-icons-svelte';
  import Menu from 'carbon-icons-svelte/lib/Menu.svelte';
  import { getPageSection } from '@/utils/helpers/page';
  import { sharedPage } from '@/utils/stores/pages';
  import Logo from '../ui/_custom/Logo.svelte';

  const seo = $derived(getPageSection($sharedPage, 'seo'));
  const content = $derived(getPageSection($sharedPage, 'navigation'));
  
  let {backgroundColor = 'bg-white dark:bg-black'} = $props()

  let open = $state(false);
  

  // Function to toggle the mobile menu
  function toggleMenu() {
    console.log('clicked');
    open = !open;
  }
</script>

{#snippet cta()} 
<a href="/courses" class="flex items-center gap-1 py-4 px-6 border-b" onclick={toggleMenu}>
  <p class="font-bold text-gray-800 text-base">Learn with me</p>
  <ArrowRight size={16} class="fill-gray-800 font-bold" />
</a>
{/snippet}

<nav class={`relative w-full flex items-center justify-between pl-6 ${backgroundColor}`}>
  <!-- Logo Section -->
  <Logo src={seo?.settings.logo} alt={seo?.settings.title}/>

  <!-- Mobile Menu Button (Visible only on mobile and when logged in) -->
 
    <button onclick={toggleMenu} class="lg:hidden px-6 py-4">
      <Menu size={24} />
    </button>
  

  <!-- Desktop Navigation Menu (Hidden on mobile) -->
  <ul
    class="hidden lg:flex items-center space-x-8 text-base font-bold text-gray-800 list-none hover:no-underline"
  >
    
      {#each content?.settings.navItems as navItem}
        <li><a href={navItem.link} 
           class="flex items-center gap-1"
          target={navItem.redirect ? '_blank' : undefined}>{navItem.title} {#if navItem.redirect}
          <ArrowUpRight />
        {/if}</a></li>
      {/each}
  </ul>
  
    
 

  <!-- Mobile Sidebar Menu (Visible only on mobile) -->
  <ul
    class={`fixed top-0 left-0 h-full bg-white w-full transform hover:no-underline ${
      open ? 'translate-y-0' : '-translate-y-full'
    } transition-transform duration-300 ease-in-out lg:hidden text-base font-bold text-gray-800 list-none cursor-pointer`}
  >
    <button onclick={toggleMenu} class="absolute right-4 top-4 lg:hidden z-20">
      <Close size={24} />
    </button>

   
      {#each content?.settings.navItems as navItem}
        <li class="py-4 px-6 border-b">
          <a href={navItem.link}  class="flex items-center gap-1" target={navItem.redirect ? '_blank' : undefined} onclick={toggleMenu}>{navItem.title}  {#if navItem.redirect}
            <ArrowUpRight />
          {/if}</a>
        </li>
      {/each}
      <div class="lg:hidden">
        {@render cta()}
      </div>
  </ul>

  <!-- Learn with Me Button (Visible on desktop when logged in) -->
 <div class="hidden lg:flex">
   {@render cta()}
 </div>

</nav>

<style>
  nav {
    position: relative;
  }
  ul {
    z-index: 10;
  }
</style>
