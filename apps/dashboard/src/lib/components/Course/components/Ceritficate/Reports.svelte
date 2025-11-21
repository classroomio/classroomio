<script>
  import SearchIcon from '@lucide/svelte/icons/search';
  import * as Pagination from '@cio/ui/base/pagination';

  import { Input } from '@cio/ui/base/input';
  import { Badge } from '@cio/ui/base/badge';
  import * as Table from '@cio/ui/base/table';
  import { Checkbox } from '@cio/ui/base/checkbox';

  import { CertificateReportData, students } from './mockData';

  let searchValue = $state('');
  let selectAll = $state(false);
  let selectedStudents = $state(new Set());

  let currentPage = $state(1);
  const pageSize = 10;

  // let totalPages = $derived(Math.ceil(students.length / pageSize));
  let startIndex = $derived((currentPage - 1) * pageSize);
  let endIndex = $derived(startIndex + pageSize);
  let paginatedStudents = $derived(students.slice(startIndex, endIndex));

  function toggleSelectAll() {
    selectAll = !selectAll;
    if (selectAll) {
      selectedStudents = new Set(paginatedStudents.map((s) => s.id));
    } else {
      selectedStudents = new Set();
    }
  }

  function toggleStudent(id) {
    if (selectedStudents.has(id)) {
      selectedStudents.delete(id);
    } else {
      selectedStudents.add(id);
    }
    selectedStudents = selectedStudents;
    selectAll = selectedStudents.size === paginatedStudents.length;
  }
</script>

<section class="-ml-4 -mr-4 mb-10 flex flex-wrap items-start gap-2">
  {#each CertificateReportData as data (data.id)}
    <div
      class="mb-5 flex h-[165px] w-[246px] flex-col justify-center rounded border border-gray-200 px-2 dark:border-neutral-600"
    >
      <p class="text-xs font-normal">{data.title}</p>
      <bold class="text-2xl font-medium">{data.value}</bold>
    </div>
  {/each}
</section>

<section>
  <div class="flex flex-row items-center justify-between gap-4">
    <p class="w-full text-base font-semibold">Certificate issued</p>
    <div class="relative w-full max-w-sm">
      <SearchIcon class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <Input type="search" placeholder="Search students" bind:value={searchValue} class="pl-10" />
    </div>
  </div>
</section>

<section class="mt-14">
  <div class="rounded-md border dark:border-neutral-600">
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head class="w-[50px]">
            <Checkbox checked={selectAll} onCheckedChange={toggleSelectAll} />
          </Table.Head>
          <Table.Head>Name of student</Table.Head>
          <Table.Head>Date issued</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each paginatedStudents as student (student.id)}
          <Table.Row>
            <Table.Cell>
              <Checkbox checked={selectedStudents.has(student.id)} onCheckedChange={() => toggleStudent(student.id)} />
            </Table.Cell>
            <Table.Cell class="font-medium">{student.name}</Table.Cell>
            <Table.Cell>
              <div class="flex items-center gap-4">
                <span class="text-sm">{student.issued}</span>
                {#if student.peronalized}
                  <Badge variant="secondary" class="bg-primary-100 text-primary-600">personalized</Badge>
                {/if}
              </div>
            </Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </div>

  {#if students.length > pageSize}
    <div class="mt-4 flex items-center justify-end">
      <Pagination.Root
        count={students.length}
        perPage={pageSize}
        page={currentPage}
        onPageChange={(page) => (currentPage = page)}
      >
        {#snippet children({ pages, currentPage: activePage })}
          <Pagination.Content>
            <Pagination.Item>
              <Pagination.PrevButton />
            </Pagination.Item>
            {#each pages as page (page.key)}
              {#if page.type === 'ellipsis'}
                <Pagination.Item>
                  <Pagination.Ellipsis />
                </Pagination.Item>
              {:else}
                <Pagination.Item>
                  <Pagination.Link {page} isActive={activePage === page.value}>
                    {page.value}
                  </Pagination.Link>
                </Pagination.Item>
              {/if}
            {/each}
            <Pagination.Item>
              <Pagination.NextButton />
            </Pagination.Item>
          </Pagination.Content>
        {/snippet}
      </Pagination.Root>
    </div>
  {/if}
</section>
