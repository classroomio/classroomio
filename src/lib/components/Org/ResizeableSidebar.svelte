<!-- ResizableSidebar.svelte -->

<script>
  let expanding = null;
  let startX = 0;
  let initialX = 0;
  let initialWidth = 300; // Initial width
  let width = initialWidth;
  let x = 20; // Initial x-position
  const grabberWidth = 10;
  const MIN_WIDTH = 300; // Minimum width
  const MAX_WIDTH = 500; // Maximum width

  function startExpand(type, event) {
    expanding = type;
    startX = event.pageX;
    initialX = x;
    initialWidth = width;
  }

  function stopExpand() {
    expanding = null;
  }

  function expand(event) {
    if (!expanding) return;

    const deltaX = event.pageX - startX;
    const newWidth = initialWidth + deltaX;

    // Ensure the width stays within the specified range
    if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
      width = newWidth;
      x = initialX + deltaX;
    }
  }
</script>

<svelte:fragment on:mouseup={stopExpand} />

<svg viewBox="0 0 100 40" height="44" width="300" on:mousemove={expand} class:expanding>
  <rect {x} y="2" {width} height="36" class="step" />
  <rect
    {x}
    y="2"
    width={grabberWidth}
    height="36"
    fill="red"
    class:active={expanding === 'left' ? 'grip active' : 'grip'}
    on:mousedown={startExpand.bind(this, 'left')}
  />
  <rect
    x={x + width - grabberWidth}
    y="2"
    width={grabberWidth}
    height="36"
    fill="blue"
    class:active={expanding === 'right' ? 'grip active' : 'grip'}
    on:mousedown={startExpand.bind(this, 'right')}
  />
</svg>

<style>
  .step {
    fill: #8884;
    stroke: #222a;
    rx: 2;
  }
  .expanding .step {
    stroke: #228e;
  }
  .grip {
    cursor: col-resize;
    fill: #fff0;
  }
  .grip.active,
  .grip:hover {
    fill: #2288;
  }
</style>
