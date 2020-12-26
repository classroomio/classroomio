<script>
  // your script goes here
  const contributors = [
    {
      name: 'Koskting'
    },
    {
      name: 'Koskting'
    },
    {
      name: 'Koskting'
    },
    {
      name: 'Koskting'
    },
    {
      name: 'Koskting'
    },
  ];
</script>

<style>
  .sidebar-root {
    padding: 16px;
    border: 1px solid #e1e4e8;
    border-radius: 6px;
    width: 200px;
    height: fit-content;
  }

  h4 {
    font-size: 14px;
    font-weight: 600;
    border-bottom: 1px solid #e1e4e8;
    padding-bottom: 10px;
  }

  .avatar {
    border-radius: 50%;
    display: inline-block;
    overflow: hidden;
    line-height: 1;
    vertical-align: middle;
    border-radius: 6px;
    margin-right: 10px;
  }

  .contributer-link {
    display: flex;
    padding: 8px 0;
  }
</style>

<!-- markup (zero or more items) goes here -->
<div class="sidebar-root">
  <h4>Most helpful</h4>
  {#each contributors as contributor}
    <a class="contributer-link" href="/{contributor.name}">
      <img
        class="avatar"
        src="https://avatars0.githubusercontent.com/u/2854919?s=40&amp;v=4"
        width="20"
        height="20"
        alt="@jamesmosier"
      >
      <span>{contributor.name}</span>
    </a>
	{/each}
</div>
