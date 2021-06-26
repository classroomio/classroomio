<script>
  import { VARIANTS, VARIANTS_CLASS } from "./constants";
  export let label;
  export let className = "";
  export let onClick = () => {};
  export let name = "";
  export let type;
  export let variant = VARIANTS.CONTAINED;

  const variantClass = VARIANTS_CLASS[variant];
</script>

<button
  class="h-auto {variantClass} py-1 px-3 rounded {className} transition delay-150 duration-300 ease-in-out"
  on:click={onClick}
  {name}
  {type}
>
  {label}
</button>
