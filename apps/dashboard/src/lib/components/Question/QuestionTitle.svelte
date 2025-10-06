<script lang="ts">
  interface Props {
    index: number;
    title: string;
  }

  let { index, title }: Props = $props();
</script>

<span class="flex gap-2">
  <p class="text-md font-medium">{index}</p>
  <p class="text-md font-medium">{title}</p>
</span>
