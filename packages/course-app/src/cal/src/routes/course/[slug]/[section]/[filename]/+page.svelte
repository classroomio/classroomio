<script>
  let { content, title } = $props();
</script>

<p class="font-semibold text-2xl mb-4 capitalize">{title}</p>
<div class="h-fit pb-14">
  {@html content}
</div>
