<script>
  import pluralize from 'pluralize';
  import OverflowMenuHorizontalIcon from 'carbon-icons-svelte/lib/OverflowMenuHorizontal.svelte';
  import dayjs from 'dayjs';
  import relativeTime from 'dayjs/plugin/relativeTime';
  import { currentOrgPath } from '$lib/utils/store/org';
  import Dropdown from '$lib/components/Dropdown/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { onRename, onDelete } from '$lib/utils/services/org/quiz';
  import { themeImages } from '$lib/utils/constants/quiz';

  dayjs.extend(relativeTime);

  export let quiz;
  export let totalQuestions;

  function getOptions() {
    return [
      // {
      //   label: 'Edit',
      //   onClick: onEdit(quiz),
      // },
      // {
      //   label: 'Share',
      //   onClick: onShare(quiz),
      // },
      // {
      //   label: 'Report',
      //   onClick: onReport(quiz),
      // },
      {
        label: 'Rename',
        onClick() {
          onRename(quiz);
        },
      },
      // {
      //   label: 'Make a copy',
      //   onClick() {
      //     onMakeCopy(quiz);
      //   },
      // },
      {
        label: 'Delete',
        onClick() {
          onDelete(quiz);
        },
      },
    ];
  }

  function startQuiz() {}
</script>

{#if quiz}
  <div
    class="root w-full border hover:shadow-2xl transition ease-in-out rounded-lg bg-gray-100 dark:bg-gray-700 mr-4 mb-5 relative flex p-3"
  >
    <img
      src={themeImages[quiz.theme]?.card || themeImages.standard.card}
      alt="quiz-card"
      class=""
      style="max-width: 300px;"
    />

    <div class="p-5 flex flex-col justify-between w-full">
      <div class="flex justify-between">
        <h4 class="dark:text-white title text-md font-bold">
          <a href="{$currentOrgPath}/quiz/{quiz.id}">{quiz.title}</a>
        </h4>

        <Dropdown
          options={getOptions()}
          classNames="absolute top-4 right-4"
          isIcon={true}
        >
          <div class="p-1 rounded-full bg-gray-200 dark:bg-gray-600">
            <OverflowMenuHorizontalIcon size={20} class="carbon-icon active" />
          </div>
        </Dropdown>
      </div>

      <div class="flex justify-between">
        <div>
          <p class="mb-2">{pluralize('question', totalQuestions, true)}</p>
          <p>Updated {dayjs(quiz.updated_at).fromNow(true)} ago</p>
        </div>

        <PrimaryButton
          className="px-6 py-3"
          variant={VARIANTS.OUTLINED}
          label="Start Quiz"
          onClick={startQuiz}
        />
      </div>
    </div>
  </div>
{/if}

<style>
  .root {
    height: 180px;
  }
</style>
