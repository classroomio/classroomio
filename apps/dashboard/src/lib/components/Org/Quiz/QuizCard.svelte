<script lang="ts">
  import pluralize from 'pluralize';
  import EllipsisIcon from '@lucide/svelte/icons/ellipsis';

  import { currentOrgPath } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { themeImages } from '$lib/utils/constants/quiz';
  import { calDateDiff } from '$lib/utils/functions/date';
  import { onRename, onDelete } from '$lib/utils/services/org/quiz';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';

  import ImageRenderer from '../ImageRenderer.svelte';
  import Dropdown from '$lib/components/Dropdown/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';

  let { quiz, totalQuestions } = $props();

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
        label: $t('components.quiz.rename'),
        onClick() {
          onRename(quiz);
        }
      },
      // {
      //   label: 'Make a copy',
      //   onClick() {
      //     onMakeCopy(quiz);
      //   },
      // },
      {
        label: $t('components.quiz.delete'),
        onClick() {
          onDelete(quiz);
        }
      }
    ];
  }

  function startQuiz() {}
</script>

{#if quiz}
  <div
    class="root relative mb-5 flex w-full flex-col rounded-lg border bg-gray-100 p-3 transition ease-in-out hover:shadow-2xl lg:flex-row dark:bg-black"
  >
    <ImageRenderer
      src={themeImages[quiz.theme]?.card || themeImages.standard.card}
      alt="quiz-card"
      className="max-w-[300px] min-w-[200px]"
    />

    <div class="flex w-full flex-col justify-between p-2 md:p-5">
      <div class="flex justify-between">
        <h4 class="title text-md capitalize dark:text-white">
          <a href="{$currentOrgPath}/quiz/{quiz.id}">{quiz.title}</a>
        </h4>

        <Dropdown options={getOptions()} classNames="absolute top-4 right-4" isIcon={true}>
          <div class="rounded-full bg-gray-200 p-1 dark:bg-gray-600">
            <EllipsisIcon size={16} />
          </div>
        </Dropdown>
      </div>

      <div class="flex flex-col justify-between md:flex-row">
        <div>
          <p class="mb-2">{pluralize('question', totalQuestions, true)}</p>
          <p class="mb-2 md:mb-0">{$t('components.quiz.updated')} {calDateDiff(quiz.updated_at)}</p>
        </div>

        <PrimaryButton
          className="px-6 py-3"
          variant={VARIANTS.OUTLINED}
          label={$t('components.quiz.start')}
          onClick={startQuiz}
        />
      </div>
    </div>
  </div>
{/if}

<style>
  .root {
    min-height: 180px;
  }
</style>
