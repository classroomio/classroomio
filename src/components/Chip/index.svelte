<script>
  export let value;
  export let className;
</script>

<p class={className ? className : 'bg-set mt-2'}>{value}</p>

<style>
  p {
    display: inline-block;
    min-width: 20px;
    padding: 0 6px;
    font-size: 12px;
    font-weight: 500;
    line-height: 18px;
    text-align: center;
    border: 1px solid transparent;
    border-radius: 2em;
  }

  .bg-set {
    color: #586069;
    background-color: #d1d5da80;
  }
</style>
