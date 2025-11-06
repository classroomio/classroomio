<script lang="ts">
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';

  let { link, icon, label } = $props();
</script>

<DropdownMenu.Item class="m-0">
  <a href={link} target="_blank" class="flex items-center gap-2">
    <img src={icon} alt={label} class="h-6 w-6 rounded-full" />
    <p class="text-sm font-semibold">{label}</p>
  </a>
</DropdownMenu.Item>
