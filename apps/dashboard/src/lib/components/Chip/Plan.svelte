<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';

  interface Props {
    name?: string;
  }

  let { name = '' }: Props = $props();
</script>

<Badge class="w-fit rounded-md border border-blue-700 px-1.5 text-center text-xs font-semibold text-blue-700"
  >{name}</Badge
>
