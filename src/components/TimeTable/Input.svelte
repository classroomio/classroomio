<script>
  export let className, value, editing;
</script>

{#if editing == false}
  <span class={`input ${className}`}> {value}</span>
{:else}
  <input
    type="text"
    class={`rounded-lg border border-1 border-gray focus:outline-none input ${className}`}
    {value}
  />
{/if}

<style>
  .small {
    width: 100%;
  }
  .large {
    width: 100%;
    text-align: center;
  }

  .input {
    margin: 2px;
    position: relative;
  }

  span.alignRight {
    text-align: right;
  }

  span.current::before {
    border-radius: 15px;
    content: " ";
    width: 10px;
    height: 10px;
    position: absolute;
    left: 0;
    top: 25%;
    animation: blink 2s step-start 0s infinite;
    -webkit-animation: blink 2s step-start 0s infinite;
  }
  @keyframes blink {
    50% {
      background-color: red;
    }
  }
  @-webkit-keyframes blink {
    50% {
      background-color: red;
    }
  }
</style>
