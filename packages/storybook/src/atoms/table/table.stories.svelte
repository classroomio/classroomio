<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import * as Table from '@cio/ui/base/table';

  const { Story } = defineMeta({
    title: 'Atom/Table',
    component: Table.Root,
    parameters: {
      layout: 'padded'
    },
    tags: ['autodocs']
  });
</script>

<Story name="Default">
  {#snippet template()}
    <Table.Root>
      <Table.Caption>A list of your recent invoices.</Table.Caption>
      <Table.Header>
        <Table.Row>
          <Table.Head class="w-[100px]">Invoice</Table.Head>
          <Table.Head>Status</Table.Head>
          <Table.Head>Method</Table.Head>
          <Table.Head class="text-right">Amount</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        <Table.Row>
          <Table.Cell class="font-medium">INV001</Table.Cell>
          <Table.Cell>Paid</Table.Cell>
          <Table.Cell>Credit Card</Table.Cell>
          <Table.Cell class="text-right">$250.00</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell class="font-medium">INV002</Table.Cell>
          <Table.Cell>Pending</Table.Cell>
          <Table.Cell>PayPal</Table.Cell>
          <Table.Cell class="text-right">$150.00</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell class="font-medium">INV003</Table.Cell>
          <Table.Cell>Unpaid</Table.Cell>
          <Table.Cell>Bank Transfer</Table.Cell>
          <Table.Cell class="text-right">$350.00</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell class="font-medium">INV004</Table.Cell>
          <Table.Cell>Paid</Table.Cell>
          <Table.Cell>Credit Card</Table.Cell>
          <Table.Cell class="text-right">$450.00</Table.Cell>
        </Table.Row>
      </Table.Body>
      <Table.Footer>
        <Table.Row>
          <Table.Cell colspan={3}>Total</Table.Cell>
          <Table.Cell class="text-right">$1,200.00</Table.Cell>
        </Table.Row>
      </Table.Footer>
    </Table.Root>
  {/snippet}
</Story>

<Story name="Simple Table">
  {#snippet template()}
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head>Name</Table.Head>
          <Table.Head>Email</Table.Head>
          <Table.Head>Role</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        <Table.Row>
          <Table.Cell>John Doe</Table.Cell>
          <Table.Cell>john@example.com</Table.Cell>
          <Table.Cell>Admin</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell>Jane Smith</Table.Cell>
          <Table.Cell>jane@example.com</Table.Cell>
          <Table.Cell>User</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell>Bob Johnson</Table.Cell>
          <Table.Cell>bob@example.com</Table.Cell>
          <Table.Cell>Editor</Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table.Root>
  {/snippet}
</Story>
