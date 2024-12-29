<script>
  export let value = 0;
</script>

<div class="relative h-2 w-full rounded-md bg-gray-300">
  <span
    class="progress bg-primary-700 absolute left-0 top-0 h-full rounded-l-md {value === 100
      ? 'rounded-r-md'
      : ''}"
    style="width: {value}%;"
  />
</div>

<style>
  .progress {
    transition: width 1s linear;
  }
</style>
