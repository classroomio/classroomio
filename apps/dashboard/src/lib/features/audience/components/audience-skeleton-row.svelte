<script lang="ts">
  import * as Table from '@cio/ui/base/table';
  import { Skeleton } from '@cio/ui/base/skeleton';

  // Cell order matches `audience-member-row.svelte`; the placeholder takes the
  // shape of the value it stands in for, so the table does not reflow when the
  // real rows arrive.
</script>

<Table.Row>
  <Table.Cell class="w-10">
    <Skeleton class="h-4 w-4 rounded-sm" />
  </Table.Cell>
  <Table.Cell>
    <div class="flex items-center gap-2">
      <Skeleton class="h-5 w-5 rounded-full" />
      <Skeleton class="h-4 w-28" />
    </div>
  </Table.Cell>
  <Table.Cell><Skeleton class="h-4 w-40" /></Table.Cell>
  <Table.Cell><Skeleton class="h-5 w-16 rounded-full" /></Table.Cell>
  <Table.Cell><Skeleton class="h-4 w-10" /></Table.Cell>
  <Table.Cell><Skeleton class="h-8 w-8 rounded-full" /></Table.Cell>
  <Table.Cell><Skeleton class="h-4 w-20" /></Table.Cell>
  <Table.Cell><Skeleton class="h-4 w-20" /></Table.Cell>
  <Table.Cell><Skeleton class="h-4 w-24" /></Table.Cell>
  <Table.Cell class="w-12"></Table.Cell>
</Table.Row>
