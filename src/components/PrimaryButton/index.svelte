<script>
  export let label;
  export let className = "";
  export let onClick = () => {};
  export let name = "";
  export let type;
</script>

<button
  class="bg-blue-700 hover:bg-blue-900 text-white font-bold py-1 px-3 rounded {className}"
  on:click={onClick}
  {name}
  {type}
>
  {label}
</button>
