<script>
  export let data = [];
  export let barColor = 'red';

  const total = data.reduce(
    (acc, cur) => (cur.count > acc ? cur.count : acc),
    0
  );

  function calcHeight(d) {
    return `${(d.count / total) * 100}%`;
  }
</script>

<div
  class="barchart flex items-start {data.length > 5
    ? 'justify-between'
    : 'justify-evenly'} flex-1 gap-2.5 mt-3 p-3"
>
  {#each data as d}
    <div class="bar-container flex flex-col justify-end items-center">
      <div class="flex flex-col items-center">
        {#if d.avatar}
          <img class="w-12 h-12" src={d.avatar} alt="user avatar" />
        {/if}
        <span class="text-xs text-center" style="width: 30px">{d.name}</span>
      </div>
      <span>{d.count}</span>
      <div style="height: {calcHeight(d)}" class="bar bg-{barColor}-700" />
    </div>
  {/each}
</div>

<style>
  .barchart {
    border-bottom: 1px solid #d6cece;
    height: 450px;
    width: 450px;
    overflow-x: auto;
  }
  .bar-container {
    height: 100%;
  }
  .bar {
    width: 40px;
  }
</style>
