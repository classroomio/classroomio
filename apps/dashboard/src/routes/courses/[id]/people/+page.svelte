<script lang="ts">
  import {
    StructuredList,
    StructuredListBody,
    StructuredListCell,
    StructuredListHead,
    StructuredListRow
  } from 'carbon-components-svelte';
  import CourseContainer from '$lib/components/CourseContainer/index.svelte';
  import PageNav from '$lib/components/PageNav/index.svelte';
  import PageBody from '$lib/components/PageBody/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import RoleBasedSecurity from '$lib/components/RoleBasedSecurity/index.svelte';
  import InvitationModal from '$lib/components/Course/components/People/InvitationModal.svelte';
  import CreateBatchModal from '$lib/components/Course/components/People/CreateBatchModal.svelte';

  import { t } from '$lib/utils/functions/translations';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  type StatusType = 'active' | 'inactive';

  type BatchType = {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    status: StatusType;
    noOfStudents: number;
  };

  export let data;

  const dummyBatch: BatchType[] = [
    {
      id: 3,
      name: 'Cohort 3',
      start_date: '2024-06-12 23:10:38.129023',
      end_date: '2024-07-12 23:10:38.129023',
      status: 'active',
      noOfStudents: 21
    },
    {
      id: 2,
      name: 'Cohort 2',
      start_date: '2024-03-12 23:10:38.129023',
      end_date: '2024-04-12 23:10:38.129023',
      status: 'inactive',
      noOfStudents: 50
    },
    {
      id: 1,
      name: 'Cohort 1',
      start_date: '2024-01-12 23:10:38.129023',
      end_date: '2024-02-12 23:10:38.129023',
      status: 'inactive',
      noOfStudents: 75
    }
  ];

  const formatTimestamp = (timestamp) => {
    let date: Date | undefined;
    timestamp.includes('Z') ? (date = new Date(timestamp)) : (date = new Date(timestamp + 'Z'));
    return new Intl.DateTimeFormat('en-GB').format(date);
  };

  const addPeopleClick = () => {
    const url = $page.url.href + '?add=true';
    goto(url);
  };
  const createBatchClick = () => {
    const url = $page.url.href + '?create-batch=true';
    goto(url);
  };
  const gotoBatch = (id: number | string) => {
    const url = $page.url.href + `/${id}`;
    goto(url);
  };
</script>

<InvitationModal />
<CreateBatchModal />

<CourseContainer bind:courseId={data.courseId}>
  <PageNav title={$t('course.navItem.people.title')} disableSticky={true}>
    <slot:fragment slot="widget">
      <RoleBasedSecurity allowedRoles={[1, 2]}>
        <PrimaryButton
          className="mr-2"
          label={$t('course.navItem.people.add')}
          onClick={addPeopleClick}
        />
      </RoleBasedSecurity>
    </slot:fragment>
  </PageNav>
  <PageBody width="w-full max-w-6xl md:w-11/12">
    <section class="my-5 mx-2 md:mx-9">
      <div
        class="flex flex-col md:flex-row flex-end gap-2 justify-start items-start md:items-center mb-7"
      >
        <PrimaryButton onClick={createBatchClick}>Create Batch</PrimaryButton>
        <RoleBasedSecurity allowedRoles={[1, 2]}>
          <p class="dark:text-white hidden lg:block text-lg w-20" />
        </RoleBasedSecurity>
      </div>

      <StructuredList class="m-0">
        <StructuredListHead
          class="bg-slate-100 dark:bg-neutral-800 dark:border-2 dark:border-neutral-800"
        >
          <StructuredListRow head class="mx-7">
            <StructuredListCell head class="text-primary-700 py-3 dark:text-white"
              >{$t('course.navItem.people.batches.batch_name')}</StructuredListCell
            >
            <StructuredListCell head class="text-primary-700 py-3 dark:text-white"
              >{$t('course.navItem.people.batches.start_date')}</StructuredListCell
            >
            <StructuredListCell head class="text-primary-700 py-3 dark:text-white"
              >{$t('course.navItem.people.batches.finishes')}</StructuredListCell
            >
            <StructuredListCell head class="text-primary-700 py-3 dark:text-white"
              >{$t('course.navItem.people.batches.status')}</StructuredListCell
            >
            <StructuredListCell head class="text-primary-700 py-3 dark:text-white"
              >{$t('course.navItem.people.batches.students')}</StructuredListCell
            >
            <RoleBasedSecurity allowedRoles={[1, 2]}>
              <p class="dark:text-white hidden lg:block text-lg w-20" />
            </RoleBasedSecurity>
          </StructuredListRow>
        </StructuredListHead>

        {#each dummyBatch as batch}
          <StructuredListBody
            class={`cursor-pointer hover:before:block hover:before:absolute before:h-[74px] before:w-1 before:bg-[#0F62FE] ${
              batch.status === 'active'
                ? 'before:block before:absolute before:h-[74px] before:w-1 before:bg-[#0F62FE]'
                : ''
            }`}
          >
            <StructuredListRow on:click={() => gotoBatch(batch.id)}>
              <!-- first column -->
              <StructuredListCell class="w-2/6">
                <p class="font-semibold text-[#282828]">{batch.name}</p>
              </StructuredListCell>

              <!-- second column -->
              <StructuredListCell class="w-1/5 px-3"
                >{formatTimestamp(batch.start_date)}</StructuredListCell
              >

              <!-- third column -->
              <StructuredListCell class="w-1/6"
                >{formatTimestamp(batch.end_date)}</StructuredListCell
              >

              <!-- fourth column -->
              <StructuredListCell class="w-1/6">
                <div class="flex items-center gap-x-2 relative top-2">
                  <svg
                    width="16"
                    height="24"
                    viewBox="0 0 16 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M8 4C6.41775 4 4.87103 4.46919 3.55544 5.34824C2.23985 6.22729 1.21447 7.47672 0.608967 8.93853C0.00346625 10.4003 -0.15496 12.0089 0.153721 13.5607C0.462403 15.1126 1.22433 16.538 2.34315 17.6569C3.46197 18.7757 4.88743 19.5376 6.43928 19.8463C7.99113 20.155 9.59966 19.9965 11.0615 19.391C12.5233 18.7855 13.7727 17.7602 14.6518 16.4446C15.5308 15.129 16 13.5822 16 12C16 9.87827 15.1571 7.84344 13.6569 6.34315C12.1566 4.84285 10.1217 4 8 4ZM6.85715 15.1943L4 12.3371L4.90857 11.4286L6.85715 13.3771L11.0914 9.14286L12.0034 10.0491L6.85715 15.1943Z"
                      fill={batch.status === 'active' ? '#0F62FE' : '#DEDEDE'}
                    />
                  </svg>
                  <span class="inline-block">
                    {batch.status === 'active' ? 'Active' : 'Inactive'}</span
                  >
                </div>
              </StructuredListCell>

              <!-- fifth column -->
              <StructuredListCell class="w-2/6">
                <div class="text-[#0233BD] bg-[#D9E0F5] rounded p-1 text-center font-medium">
                  {batch.noOfStudents}
                  {$t('course.navItem.people.batches.students')}
                </div>
              </StructuredListCell>
            </StructuredListRow>
          </StructuredListBody>
        {/each}
      </StructuredList>
      <!-- <Pagination totalItems={10} pageSizes={[10, 15, 20]} /> -->
    </section>
  </PageBody>
</CourseContainer>
