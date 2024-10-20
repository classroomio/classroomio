<script lang="ts">
  interface Props {
    label: string;
  }

  let { label }: Props = $props();
</script>

<p class="whitespace-nowrap bg-gray-200 px-2 py-1 rounded-full text-xs font-normal text-black">
  {label}
</p>
