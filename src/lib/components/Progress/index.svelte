<script>
  export let value = 0;
</script>

<div class="w-full h-3 rounded-md bg-gray-300 relative">
  <span
    class="progress absolute top-0 left-0 rounded-md bg-primary-700 h-full"
    style="width: {value}%;"
  />
</div>

<style>
  .progress {
    transition: width 1s linear;
  }
</style>
