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
    Pagination
  } from 'carbon-components-svelte';

  let searchValue = $state('');
  let checked = $state(false);
</script>

<section class="-ml-4 -mr-4 mb-10 flex flex-wrap items-start gap-2">
  {#each CertificateReportData as data (data.id)}
    <div class="box mb-5 flex flex-col justify-center rounded border border-gray-200 px-2 dark:border-neutral-600">
      <p class="text-xs font-normal">{data.title}</p>
      <bold class="text-2xl font-medium">{data.value}</bold>
    </div>
  {/each}
</section>

<section>
  <div class="flex flex-row items-center justify-between">
    <p class="w-full text-base font-semibold">Certificate issued</p>
    <Search placeholder="search students" bind:value={searchValue} searchClass="border-b border-transparent" />
  </div>
</section>

<section class="mt-14 border-t border-gray-300">
  <StructuredList>
    <StructuredListHead class="bg-primary-50 py-0">
      <StructuredListRow head class="py-0">
        <StructuredListCell head class="py-0">
          <div class="flex-3 text-primary-600 flex w-full flex-row items-center justify-start text-sm font-medium">
            <Checkbox bind:checked />
            <p class="text-primary-900 w-full text-start text-sm font-medium">Name of student</p>
          </div>
        </StructuredListCell>
        <StructuredListCell head class="py-0">
          <div class="flex-2 text-primary-900 w-full items-center text-sm font-medium">
            <p class="pt-1 align-middle text-sm font-medium">Date issued</p>
            <p class="opacity-0">personalized</p>
          </div>
        </StructuredListCell>
      </StructuredListRow>
    </StructuredListHead>
    <StructuredListBody>
      {#each students as item (item.id)}
        <StructuredListRow label for="row-{item}">
          <StructuredListCell>
            <div class="flex-3 flex w-full flex-row items-center justify-start pt-4 text-sm font-medium">
              <Checkbox />
              <p class="w-full text-start text-sm font-normal">{item.name}</p>
            </div>
          </StructuredListCell>
          <StructuredListCell>
            <div class="flex-2 flex w-full flex-row items-center gap-10">
              <p class="align-middle text-sm font-normal">{item.issued}</p>
              {#if item.peronalized == true}
                <span class="bg-primary-100 rounded-lg px-3 py-2 text-center">
                  <p class="text-primary-600 text-xs opacity-100">personalized</p>
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
