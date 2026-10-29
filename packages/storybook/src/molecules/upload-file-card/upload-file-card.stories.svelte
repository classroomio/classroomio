<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { UploadFileCard } from '@cio/ui';
  import { FIELDS } from './fields';

  const labels = {
    completed: 'Completed',
    failed: 'Failed',
    retry: 'Try Again',
    remove: 'Remove file',
    uploading: (percent) => `Uploading ${percent}%`,
    transferred: (uploaded, total) => `${uploaded} of ${total}`
  };

  const { Story } = defineMeta({
    title: 'Molecules/UploadFileCard',
    component: UploadFileCard,
    args: {
      name: 'learner_scores.xlsx',
      size: 2411724,
      status: 'uploading',
      progress: 42,
      labels
    },
    parameters: {
      layout: 'padded',
      controls: {
        include: FIELDS
      }
    },
    argTypes: {
      status: { control: 'select', options: ['queued', 'uploading', 'done', 'error'] },
      progress: { control: { type: 'range', min: 0, max: 100, step: 1 } },
      onRemove: { control: false },
      onRetry: { control: false },
      formatSize: { control: false }
    },
    tags: ['autodocs']
  });
</script>

<Story name="Uploading">
  {#snippet template(args)}
    <div class="w-full max-w-md">
      <UploadFileCard {...args} onRemove={() => console.log('remove')} />
    </div>
  {/snippet}
</Story>

<Story name="Queued" args={{ status: 'queued', progress: 0 }}>
  {#snippet template(args)}
    <div class="w-full max-w-md">
      <UploadFileCard {...args} onRemove={() => console.log('remove')} />
    </div>
  {/snippet}
</Story>

<Story name="AlmostDone" args={{ progress: 96 }}>
  {#snippet template(args)}
    <div class="w-full max-w-md">
      <UploadFileCard {...args} onRemove={() => console.log('remove')} />
    </div>
  {/snippet}
</Story>

<Story name="Completed" args={{ status: 'done', progress: 100 }}>
  {#snippet template(args)}
    <div class="w-full max-w-md">
      <UploadFileCard {...args} />
    </div>
  {/snippet}
</Story>

<Story name="Failed" args={{ status: 'error', progress: 63 }}>
  {#snippet template(args)}
    <div class="w-full max-w-md">
      <UploadFileCard {...args} onRetry={() => console.log('retry')} onRemove={() => console.log('remove')} />
    </div>
  {/snippet}
</Story>

<Story name="FailedWithReason" args={{ status: 'error', progress: 63, errorMessage: 'Network Error' }}>
  {#snippet template(args)}
    <div class="w-full max-w-md">
      <UploadFileCard {...args} onRetry={() => console.log('retry')} onRemove={() => console.log('remove')} />
    </div>
  {/snippet}
</Story>

<Story name="FailedWithoutRetry" args={{ status: 'error', progress: 63 }}>
  {#snippet template(args)}
    <div class="w-full max-w-md">
      <UploadFileCard {...args} onRemove={() => console.log('remove')} />
    </div>
  {/snippet}
</Story>

<Story
  name="LongFileName"
  args={{ name: 'q3-cohort-retention-analysis-final-v2-reviewed-by-ops.ipynb', size: 487424, progress: 71 }}
>
  {#snippet template(args)}
    <div class="w-full max-w-sm">
      <UploadFileCard {...args} onRemove={() => console.log('remove')} />
    </div>
  {/snippet}
</Story>

<Story name="FileTypes">
  {#snippet template()}
    <div class="flex w-full max-w-md flex-col gap-2">
      <UploadFileCard name="syllabus.pdf" size={1258291} status="done" progress={100} {labels} />
      <UploadFileCard name="handout.docx" size={86016} status="done" progress={100} {labels} />
      <UploadFileCard name="legacy-notes.doc" size={45056} status="done" progress={100} {labels} />
      <UploadFileCard name="sales_data.csv" size={650240} status="done" progress={100} {labels} />
      <UploadFileCard name="learner_scores.xlsx" size={1802240} status="done" progress={100} {labels} />
      <UploadFileCard name="cohort_analysis.ipynb" size={475136} status="done" progress={100} {labels} />
      <UploadFileCard name="clean_data.py" size={312832} status="done" progress={100} {labels} />
      <UploadFileCard name="README" size={2048} status="done" progress={100} {labels} />
    </div>
  {/snippet}
</Story>

<Story name="UploadQueue">
  {#snippet template()}
    <div class="flex w-full max-w-md flex-col gap-2">
      <UploadFileCard name="sales_data.csv" size={650240} status="done" progress={100} {labels} />
      <UploadFileCard
        name="cohort_analysis.ipynb"
        size={475136}
        status="uploading"
        progress={58}
        {labels}
        onRemove={() => console.log('remove')}
      />
      <UploadFileCard
        name="learner_scores.xlsx"
        size={1802240}
        status="uploading"
        progress={12}
        {labels}
        onRemove={() => console.log('remove')}
      />
      <UploadFileCard
        name="clean_data.py"
        size={312832}
        status="queued"
        progress={0}
        {labels}
        onRemove={() => console.log('remove')}
      />
      <UploadFileCard
        name="notes.pdf"
        size={2097152}
        status="error"
        progress={34}
        {labels}
        onRetry={() => console.log('retry')}
        onRemove={() => console.log('remove')}
      />
    </div>
  {/snippet}
</Story>
