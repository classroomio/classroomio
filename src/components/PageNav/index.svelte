<script>
  export let title = "";
  export let navItems = [];
</script>

<div class="header flex justify-between mb-2">
  <h4 class="title">{title}</h4>
  {#if Array.isArray(navItems) && navItems.length}
    <div class="flex justify-evenly items-center">
      {#each navItems as item}
        <a class="mr-5 text-sm {item.isActive && 'active'}" href={item.href}>
          {item.label}
        </a>
      {/each}
    </div>
  {/if}
</div>

<style>
  .header {
    border-bottom: 1px solid var(--border-color);
    padding: 15px;
  }

  .title {
    font-size: 20px;
  }

  h4 {
    font-size: 16px;
    font-weight: 900;
    word-break: break-word;
    overflow-wrap: break-word;
    margin: 0;
  }

  .active {
    position: relative;
    display: inline-block;
  }

  .active::after {
    position: absolute;
    content: "";
    width: 100%;
    height: 3px;
    background-color: var(--main-primary-color);
    display: block;
  }

  @media only screen and (max-width: 1002px) {
    .header {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
