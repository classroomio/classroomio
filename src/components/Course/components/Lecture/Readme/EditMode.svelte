<script>
  import EditContent from "../../../../EditContent/index.svelte";
  import readme from "../../readme.js";

  let value = readme;
</script>

<EditContent {value} placeholder="Start typing your lesson" />
