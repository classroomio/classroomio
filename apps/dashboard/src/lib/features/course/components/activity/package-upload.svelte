<script lang="ts">
  import axios from 'axios';
  import { Button } from '@cio/ui/base/button';
  import { Checkbox } from '@cio/ui/base/checkbox';
  import { Progress } from '@cio/ui/base/progress';
  import * as Alert from '@cio/ui/base/alert';
  import * as FileDropZone from '@cio/ui/custom/file-drop-zone';
  import type { FileRejectedReason } from '@cio/ui/custom/file-drop-zone';
  import { UnsavedChanges } from '$features/ui';
  import { snackbar } from '$features/ui/snackbar/store';
  import { activityApi, packageApi } from '$features/course/api';
  import { jobsApi, JobPoller, type MediaJobEnvelope } from '$features/jobs';
  import { t } from '$lib/utils/functions/translations';
  import { getResolvedUploadLimits } from '$lib/utils/config/upload-limits-context';
  import { packageErrorKey } from '$features/course/utils/scorm-utils';
  import { onDestroy } from 'svelte';

  interface Props {
    courseId: string;
    activityId: string;
    assetId?: string | null;
    mode: 'attach' | 'replace';
    onAttached?: (assetId: string) => void;
    onReplaced?: () => void;
  }

  let { courseId, activityId, assetId = null, mode, onAttached, onReplaced }: Props = $props();

  type Phase = 'idle' | 'uploading' | 'processing' | 'failed';

  let file = $state<File | null>(null);
  let phase = $state<Phase>('idle');
  let progress = $state(0);
  let stage = $state<string | null>(null);
  let errorKey = $state<string | null>(null);
  let moveEveryone = $state(false);
  let abortController = $state<AbortController | null>(null);
  let poller = $state<JobPoller<MediaJobEnvelope> | null>(null);
  let hasUnsavedChanges = $state(false);

  const uploadLimits = getResolvedUploadLimits();
  const maxSize = uploadLimits.scormBytes;

  $effect(() => {
    hasUnsavedChanges = phase === 'uploading' || phase === 'processing';
  });

  function stopPoller() {
    poller?.stop();
    poller = null;
  }

  onDestroy(() => {
    stopPoller();
    abortController?.abort();
  });

  function reset() {
    stopPoller();
    file = null;
    phase = 'idle';
    progress = 0;
    stage = null;
    errorKey = null;
  }

  function handleRejected({ reason }: { reason: FileRejectedReason }) {
    if (reason === 'Maximum file size exceeded') {
      snackbar.error($t('course.navItem.lessons.activities.package.too_large', { size: formatMaxSize() }));
      return;
    }

    snackbar.error($t('course.navItem.lessons.activities.package.wrong_type'));
  }

  function formatMaxSize(): string {
    return `${Math.round(maxSize / (1024 * 1024))} MB`;
  }

  function isZipName(name: string): boolean {
    return name.toLowerCase().endsWith('.zip');
  }

  async function startUpload() {
    const selected = file;
    if (!selected || phase === 'uploading' || phase === 'processing') return;

    if (!isZipName(selected.name)) {
      snackbar.error($t('course.navItem.lessons.activities.package.wrong_type'));
      return;
    }

    phase = 'uploading';
    progress = 0;
    errorKey = null;
    abortController = new AbortController();

    try {
      if (mode === 'attach') {
        await uploadFirstVersion(selected, abortController.signal);
      } else {
        await uploadReplacement(selected, abortController.signal);
      }
    } catch (error) {
      if (abortController?.signal.aborted) return;

      console.error('Package upload error:', error);
      phase = 'failed';
      errorKey = 'course.navItem.lessons.activities.package.errors.generic';
    }
  }

  async function putZip(url: string, selected: File, signal: AbortSignal) {
    await axios.put(url, selected, {
      // The presigned URL is signed for application/zip; browsers report ZIPs inconsistently.
      headers: { 'Content-Type': 'application/zip' },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      signal,
      onUploadProgress: (event) => {
        progress = Math.round((event.loaded * 100) / (event.total || 1));
      }
    });
  }

  async function uploadFirstVersion(selected: File, signal: AbortSignal) {
    const created = await packageApi.create({ fileName: selected.name, fileSize: selected.size });
    if (!created) throw new Error('Failed to create package');

    await putZip(created.uploadUrl, selected, signal);
    const jobId = await packageApi.process(created.asset.id, created.version.id);
    if (!jobId) throw new Error('Failed to process package');

    await pollUntilDone(
      jobId,
      async () => {
        const details = await packageApi.get(created.asset.id);
        const current = details?.currentVersion;
        if (current?.status === 'ready') {
          await activityApi.attachPackage(courseId, activityId, created.asset.id);
          if (activityApi.success) onAttached?.(created.asset.id);
          return;
        }

        throw new Error('Package is not ready');
      },
      async () => {
        await resolveFailedVersionError(created.asset.id);
      }
    );
  }

  async function uploadReplacement(selected: File, signal: AbortSignal) {
    if (!assetId) throw new Error('No package to replace');

    const next = await packageApi.createVersion(assetId);
    if (!next) throw new Error('Failed to create package version');

    await putZip(next.uploadUrl, selected, signal);
    const jobId = await packageApi.process(assetId, next.version.id);
    if (!jobId) throw new Error('Failed to process package');

    await pollUntilDone(
      jobId,
      async () => {
        await packageApi.makeCurrent(assetId, next.version.id, moveEveryone);
        if (packageApi.success) onReplaced?.();
      },
      async () => {
        await resolveFailedVersionError(assetId);
      }
    );
  }

  async function pollUntilDone(
    jobId: string,
    onCompleted: () => Promise<void>,
    onFailed: () => Promise<void> = async () => {}
  ) {
    phase = 'processing';

    await new Promise<void>((resolve) => {
      stopPoller();
      poller = new JobPoller<MediaJobEnvelope>({
        fetch: () => jobsApi.getMediaJob(jobId),
        onUpdate: (envelope) => {
          const job = envelope.job as { status?: string; stage?: string | null; progressPercent?: number };
          stage = job.stage ?? null;
          if (typeof job.progressPercent === 'number') progress = job.progressPercent;

          if (job.status === 'completed') {
            stopPoller();
            void onCompleted()
              .then(() => resolve())
              .catch((error) => {
                console.error('Package finalize error:', error);
                phase = 'failed';
                errorKey = 'course.navItem.lessons.activities.package.errors.generic';
                resolve();
              });
          }

          if (job.status === 'failed' || job.status === 'canceled') {
            stopPoller();
            void onFailed()
              .catch(() => {})
              .then(() => {
                if (!errorKey) errorKey = 'course.navItem.lessons.activities.package.errors.generic';
                phase = 'failed';
                resolve();
              });
          }
        },
        onError: () => {
          stopPoller();
          phase = 'failed';
          errorKey = 'course.navItem.lessons.activities.package.errors.generic';
          resolve();
        }
      });
      poller.start();
    });
  }

  async function resolveFailedVersionError(assetIdForError: string) {
    const details = await packageApi.get(assetIdForError);
    const failed = details?.versions.find((version) => version.status === 'failed');
    const code = (failed?.error as { code?: string } | null)?.code;

    errorKey = packageErrorKey(code);
  }

  function cancelUpload() {
    abortController?.abort();
    abortController = null;
    reset();
  }
</script>

<UnsavedChanges bind:hasUnsavedChanges />

<div data-testid="activity-package-dropzone">
  {#if phase === 'idle' || phase === 'failed'}
    {#if phase === 'failed' && errorKey}
      <Alert.Root variant="destructive" class="mb-4">
        <Alert.Title>{$t('course.navItem.lessons.activities.package.failed_title')}</Alert.Title>
        <Alert.Description>{$t(errorKey)}</Alert.Description>
      </Alert.Root>
    {/if}

    {#if file}
      <div class="ui:border-border mb-4 flex items-center gap-3 rounded-lg border p-4">
        <div class="min-w-0 flex-1 text-left">
          <p class="ui:text-foreground truncate font-medium">{file.name}</p>
          <p class="ui:text-muted-foreground text-sm">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
        </div>
        <Button variant="outline" size="sm" onclick={() => (file = null)}>
          {$t('course.navItem.lessons.activities.package.retry')}
        </Button>
      </div>
    {:else}
      <FileDropZone.Root
        accept=".zip,application/zip,application/x-zip-compressed"
        maxFiles={1}
        fileCount={0}
        maxFileSize={maxSize}
        onUpload={(files) => {
          if (files[0]) file = files[0];
        }}
        onFileRejected={handleRejected}
      >
        <FileDropZone.Trigger
          label={$t('course.navItem.lessons.activities.package.drop_label')}
          formatMaxSize={() => $t('course.navItem.lessons.activities.package.drop_hint', { size: formatMaxSize() })}
        />
      </FileDropZone.Root>
    {/if}

    {#if mode === 'replace'}
      <label class="mt-4 flex items-start gap-2 text-sm">
        <Checkbox bind:checked={moveEveryone} />
        <span>
          {$t('course.navItem.lessons.activities.package.move_everyone')}
          <span class="ui:text-muted-foreground block text-xs">
            {$t('course.navItem.lessons.activities.package.move_everyone_helper', { count: 0 })}
          </span>
        </span>
      </label>
    {/if}

    {#if file}
      <div class="mt-4 flex justify-end">
        <Button onclick={startUpload} disabled={!file}>
          {mode === 'attach'
            ? $t('course.navItem.lessons.add_content_create')
            : $t('course.navItem.lessons.activities.package.replace')}
        </Button>
      </div>
    {/if}
  {:else}
    <div class="space-y-3">
      <div class="mb-1 flex justify-between text-sm">
        <span>
          {#if phase === 'uploading'}
            {$t('course.navItem.lessons.activities.package.uploading', { progress })}
          {:else}
            {$t('course.navItem.lessons.activities.package.processing')}
          {/if}
        </span>
        <span>{progress}%</span>
      </div>
      <Progress value={progress} max={100} />
      {#if stage}
        <p class="ui:text-muted-foreground text-xs">
          {$t('course.navItem.lessons.activities.package.processing_stage', { stage, progress })}
        </p>
      {/if}
      <p class="ui:text-muted-foreground text-xs">
        {$t('course.navItem.lessons.activities.package.drop_hint', { size: formatMaxSize() })}
      </p>
      {#if phase === 'uploading'}
        <div class="flex justify-center">
          <Button variant="outline" size="sm" onclick={cancelUpload}>
            {$t('course.navItem.lessons.activities.package.cancel_upload')}
          </Button>
        </div>
      {/if}
    </div>
  {/if}
</div>
