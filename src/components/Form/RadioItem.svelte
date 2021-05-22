<script>
  export let label;
  export let value;
  export let checked;
  export let name;
</script>

<label class="inline-flex items-center">
  <input class="form-radio" type="radio" {checked} {name} {value} />
  <span class="ml-2">{label}</span>
</label>
