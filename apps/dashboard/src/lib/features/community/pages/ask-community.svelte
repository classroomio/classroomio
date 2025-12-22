<script lang="ts">
  import * as Select from '@cio/ui/base/select';
  import { Button } from '@cio/ui/base/button';
  import { InputField } from '@cio/ui/custom/input-field';
  import { TextEditor } from '$features/ui';

  import { profile } from '$lib/utils/store/user';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg } from '$lib/utils/store/org';
  import { communityApi } from '$features/community/api/community.svelte';

  interface Props {
    isLMS?: boolean;
  }

  let { isLMS = false }: Props = $props();

  let fields = $state({
    title: '',
    body: '',
    courseId: ''
  });

  $effect(() => {
    if ($profile.id && $currentOrg.id) {
      communityApi.fetchCoursesForOrg($profile.id, $currentOrg.id);
    }
  });
</script>

<div class="mb-3 flex justify-between gap-x-5">
  <InputField
    bind:value={fields.title}
    placeholder={$t('community.ask.title')}
    errorMessage={communityApi.errors.title}
    className="w-[75%]"
  />
  <div class="w-[25%]">
    <Select.Root type="single" bind:value={fields.courseId}>
      <Select.Trigger class="h-full w-full">
        <p>
          {fields.courseId
            ? communityApi.courses.find((course) => course.id === fields.courseId)?.title
            : $t('community.ask.select_course')}
        </p>
      </Select.Trigger>
      <Select.Content>
        {#each communityApi.courses as course}
          {#if course.id}
            <Select.Item value={course.id}>{course.title}</Select.Item>
          {/if}
        {/each}
      </Select.Content>
    </Select.Root>
    {#if communityApi.errors.courseId}
      <p class="mt-1 text-sm text-red-500">
        {communityApi.errors.courseId}
      </p>
    {/if}
  </div>
</div>
<div class="px-2">
  <TextEditor placeholder="Give an answer" content={fields.body} onChange={(content) => (fields.body = content)} />

  {#if communityApi.errors.body}
    <p class="mt-2 text-sm text-red-500">{communityApi.errors.body}</p>
  {/if}
</div>

<div class="mt-4 flex justify-end">
  <Button
    variant="default"
    onclick={() => communityApi.createQuestion(fields, isLMS)}
    disabled={communityApi.isLoading}
  >
    {$t('community.ask.publish')}
  </Button>
</div>
