<script>
  import { page } from '$app/stores';
  import Chip from '$lib/components/Chip/index.svelte';

  let sections = [
    {
      id: 1,
      title: 'Pending',
      value: 0,
      items: [
        {
          id: 1,
          statusId: 'pending',
          isEarly: true,
          submittedAt: '5 min ago',
          exercise: {
            id: 1,
            title: 'Ai for dummies'
          },
          // answers,
          student: {
            username: 'user'
          },
          lesson: {
            id: 1,
            title: 'Introduction to AI'
          }
        }
      ],
      className: 'text-[#E35353] bg-[#FDDFE4]'
    },
    {
      id: 2,
      title: 'Submitted',
      value: 0,
      items: [
        {
          id: 2,
          statusId: 'pending',
          isEarly: true,
          submittedAt: '5 min ago',
          exercise: {
            id: 2,
            title: 'Digital photography for dummies'
          },
          // answers,
          student: {
            username: 'user'
          },
          lesson: {
            id: 2,
            title: 'Introduction to Photography'
          }
        }
      ],
      className: 'text-[#0233BD] bg-[#D9E0F5]'
    },
    {
      id: 3,
      title: 'Graded',
      value: 0,
      items: [
        {
          id: 3,
          statusId: 'pending',
          isEarly: true,
          submittedAt: '5 min ago',
          exercise: {
            id: 3,
            title: 'Landscaping and its deep secrets'
          },
          // answers,
          student: {
            username: 'user'
          },
          lesson: {
            id: 1,
            title: 'Introduction to Landscape'
          }
        }
      ],
      className: 'text-[#0F9D58] bg-[#E2FEEA]'
    }
  ];
</script>

<section class="w-full max-w-6xl mx-auto">
  <div class="py-10 px-5">
    <div class="flex items-center justify-between mb-10">
      <h1 class="dark:text-white text-3xl font-bold">Exercises</h1>
    </div>

    <div>
      <div class="flex items-center w-full">
        {#each sections as { title, items, className }}
          <div
            class="min-w-[355px] max-w-[355px] h-[516px] rounded-md bg-gray-100 dark:bg-black border border-gray-50 dark:border-neutral-700 p-3 mr-3 overflow-hidden"
          >
            <div class="flex items-center mb-2 gap-2">
              <p class="dark:text-white ml-2 font-bold">{title}</p>
              <Chip value={items.length} {className} />
            </div>
            <div class="content pr-2 overflow-y-auto mb-3">
              {#each items as item (item.id)}
                <div class=" w-full my-2 mx-0 rounded-md bg-white dark:bg-neutral-800 py-3 px-3">
                  <a
                    class="flex w-full items-center cursor-pointer text-black mb-2"
                    href={`${$page.url.pathname}?submissionId=${item.id}`}
                  >
                    <p class="dark:text-white ml-2 text-sm">
                      {item.student.username}
                    </p>
                  </a>
                  <a
                    class="text-primary-700 dark:text-white text-md font-bold"
                    href="{$page.url.pathname}?submissionId={item.id}"
                  >
                    {item.exercise.title}
                  </a>
                  <a
                    class="flex items-center no-underline hover:underline text-black my-2"
                    href="{$page.url?.pathname?.replace('submissions', 'lessons')}/{item.lesson
                      .id}/exercises/{item.exercise.id}"
                  >
                    <p class="dark:text-white text-grey text-sm">
                      #{item.lesson.title}
                      {`${item.tutor ? 'created by' + item.tutor.name : ''}`}
                    </p>
                  </a>
                  <p class="dark:text-white text-gray-500 text-xs">
                    {item.submittedAt}
                  </p>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</section>
