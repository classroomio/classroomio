<script lang="ts">
  import * as Kbd from '@cio/ui/base/kbd';
  import * as InputGroup from '@cio/ui/base/input-group';
  import SearchIcon from '@lucide/svelte/icons/search';
</script>

<InputGroup.Root class="hidden! md:flex! max-w-56">
  <InputGroup.Input placeholder="Search..." />
  <InputGroup.Addon>
    <SearchIcon />
  </InputGroup.Addon>
  <InputGroup.Addon align="inline-end">
    <Kbd.Root>⌘</Kbd.Root>
    <Kbd.Root>K</Kbd.Root>
  </InputGroup.Addon>
</InputGroup.Root>
