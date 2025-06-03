<script lang="ts">
  export let name;
  export let href: string;
  export let isActive = false;
  export let onClick: () => void;
</script>

{#key isActive}
  <a
    class="w-full flex items-center gap-2 hover:bg-posthog-background px-2 py-2 rounded-md text-sm text-start leading-4 line-clamp-2 capitalize"
    {href}
    class:bg-posthog-background={isActive}
    on:click={onClick}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.4"
      stroke-linecap="round"
      stroke-linejoin="round"
      ><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path
        d="M14 2v4a2 2 0 0 0 2 2h4"
      /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" /></svg
    >
    <span class="w-[90%]">{name}</span>
  </a>
{/key}
