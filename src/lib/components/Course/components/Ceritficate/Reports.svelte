<script>
  import { CertificateReportData, students } from './mockData';
  import {
    Search,
    Checkbox,
    StructuredList,
    StructuredListHead,
    StructuredListRow,
    StructuredListCell,
    StructuredListBody,
    Pagination,
  } from 'carbon-components-svelte';

  let searchValue = '';
  let checked = false;
</script>

<section class="flex flex-wrap items-start gap-2 mb-10 -ml-4 -mr-4">
  {#each CertificateReportData as data (data.id)}
    <div
      class="box flex flex-col rounded border border-gray-200 justify-center px-2 mb-5"
    >
      <p class="text-xs font-normal">{data.title}</p>
      <bold class="text-2xl font-medium">{data.value}</bold>
    </div>
  {/each}
</section>

<section>
  <div class="flex flex-row items-center justify-between">
    <p class="text-base font-semibold w-full">Certificate issued</p>
    <Search
      placeholder="search students"
      bind:value={searchValue}
      searchClass="border-b border-transparent"
    />
  </div>
</section>

<section class="mt-14 border-t border-gray-300">
  <StructuredList>
    <StructuredListHead class="bg-blue-50 py-0">
      <StructuredListRow head class="py-0">
        <StructuredListCell head class="py-0">
          <div
            class="flex-3 flex flex-row items-center justify-start w-full text-blue-600 text-sm font-medium"
          >
            <Checkbox bind:checked />
            <p class="text-blue-900 text-start w-full text-sm font-medium">
              Name of student
            </p>
          </div>
        </StructuredListCell>
        <StructuredListCell head class="py-0">
          <div
            class="flex-2 items-center w-full text-blue-900 text-sm font-medium"
          >
            <p class="align-middle text-sm font-medium pt-1">Date issued</p>
            <p class="opacity-0">personalized</p>
          </div>
        </StructuredListCell>
      </StructuredListRow>
    </StructuredListHead>
    <StructuredListBody>
      {#each students as item (item.id)}
        <StructuredListRow label for="row-{item}">
          <StructuredListCell>
            <div
              class="flex-3 flex flex-row items-center justify-start w-full text-sm font-medium pt-4"
            >
              <Checkbox />
              <p class="text-start w-full text-sm font-normal">{item.name}</p>
            </div>
          </StructuredListCell>
          <StructuredListCell>
            <div class="flex-2 flex flex-row items-center gap-10 w-full">
              <p class="text-sm font-normal align-middle">{item.issued}</p>
              {#if item.peronalized == true}
                <span class="text-center bg-blue-100 px-3 py-2 rounded-lg">
                  <p class="opacity-100 text-xs text-blue-600">personalized</p>
                </span>
              {:else}
                <p class="opacity-0">personalized</p>
              {/if}
            </div>
          </StructuredListCell>
        </StructuredListRow>
      {/each}
    </StructuredListBody>
  </StructuredList>
  <Pagination totalItems={10} pageSizes={[10, 15, 20]} />
</section>

<style>
  .box {
    width: 246px;
    height: 165px;
  }
</style>
