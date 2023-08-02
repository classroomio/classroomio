<script>
  export let value = 0;
  export let className = '';
</script>

<p class={className ? className : 'bg-set mt-2'}>{value}</p>

<style>
  p {
    display: inline-block;
    min-width: 20px;
    font-size: 12px;
    font-weight: 500;
    line-height: 18px;
    text-align: center;
    border: 1px solid transparent;
    border-radius: 2em;

    width: 24px;
    height: 24px;
    padding-top: 2px;
  }

  .bg-set {
    background-color: #d1d5da80;
  }
</style>
