<script lang="ts">
  import axios from 'axios';
  import { Button } from '@cio/ui/base/button';
  import { Label } from '@cio/ui/base/label';
  import { Checkbox } from '@cio/ui/base/checkbox';
  import * as Dialog from '@cio/ui/base/dialog';
  import * as RadioGroup from '@cio/ui/base/radio-group';
  import { Progress } from '@cio/ui/base/progress';
  import * as Alert from '@cio/ui/base/alert';
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
  import InfoIcon from '@lucide/svelte/icons/info';
  import * as FileDropZone from '@cio/ui/custom/file-drop-zone';
  import type { FileRejectedReason } from '@cio/ui/custom/file-drop-zone';
  import { UnsavedChanges } from '$features/ui';
  import { snackbar } from '$features/ui/snackbar/store';
  import { activityApi, packageApi } from '$features/course/api';
  import { jobsApi, JobPoller, type MediaJobEnvelope } from '$features/jobs';
  import { t } from '$lib/utils/functions/translations';
  import { getResolvedUploadLimits } from '$lib/utils/config/upload-limits-context';
  import {
    comparePackageIdentity,
    formatPackageBytes,
    sha256IfSameSize,
    packageErrorKey,
    readScormManifestSignature,
    type PackageIdentityVerdict
  } from '$features/course/utils/scorm-utils';
  import type { PackageFingerprint, PackageJobResult } from '$features/course/utils/types';
  import { onDestroy } from 'svelte';

  interface Props {
    courseId: string;
    activityId: string;
    assetId?: string | null;
    mode: 'attach' | 'upgrade' | 'swap';
    inProgressCount?: number;
    currentFingerprint?: PackageFingerprint | null;
    getFreshInProgressCount?: () => Promise<number>;
    onAttached?: (assetId: string) => void;
    onReplaced?: () => void;
    onSwapRequest?: () => void;
    onUpgradeRequest?: () => void;
  }

  let {
    courseId,
    activityId,
    assetId = null,
    mode,
    inProgressCount = 0,
    currentFingerprint = null,
    getFreshInProgressCount,
    onAttached,
    onReplaced,
    onSwapRequest,
    onUpgradeRequest
  }: Props = $props();

  type Phase = 'idle' | 'uploading' | 'processing' | 'failed';

  let file = $state<File | null>(null);
  let phase = $state<Phase>('idle');
  let progress = $state(0);
  let stage = $state<string | null>(null);
  let errorKey = $state<string | null>(null);
  let replaceChoice = $state<'keep' | 'restart'>('keep');
  let peeking = $state(false);
  let peek = $state<{
    file: File;
    verdict: 'same_file' | PackageIdentityVerdict;
    contentSha256: string | null;
    title: string | null;
    count: number;
  } | null>(null);
  let acknowledgedFor = $state<{ file: File; mode: Props['mode'] } | null>(null);
  let promoteOpen = $state(false);
  let promoteCount = $state(0);
  let promoteResolver = $state<((choice: 'keep' | 'restart') => void) | null>(null);
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
    peek = null;
    peeking = false;
    acknowledgedFor = null;
    promoteOpen = false;
    promoteResolver = null;
  }

  function selectFile(next: File | null) {
    file = next;
    errorKey = null;
    peek = null;
    acknowledgedFor = null;
    if (next && (mode === 'upgrade' || mode === 'swap') && currentFingerprint) void readPeek(next);
  }

  async function readPeek(target: File) {
    peeking = true;
    try {
      const current = currentFingerprint!;
      const contentSha256 = await sha256IfSameSize(target, current);
      const sameFile = contentSha256 !== null && contentSha256 === current.contentSha256;
      const signature = await readScormManifestSignature(target);
      const verdict = sameFile ? 'same_file' : comparePackageIdentity(signature, current);
      const result = { file: target, verdict, contentSha256, title: signature.title, count: signature.itemIds.length };
      if (file === target) peek = result;

      return result;
    } finally {
      if (file === target) peeking = false;
    }
  }

  const identityMismatch = $derived(
    !!file &&
      peek?.file === file &&
      ((mode === 'upgrade' && peek.verdict === 'different_course') ||
        (mode === 'swap' && peek.verdict === 'same_course'))
  );
  const acknowledged = $derived(acknowledgedFor?.file === file && acknowledgedFor?.mode === mode);
  const uploadBlocked = $derived(identityMismatch && !acknowledged);

  function setAcknowledged(checked: boolean) {
    acknowledgedFor = checked && file ? { file, mode } : null;
  }

  function finishUnchanged() {
    snackbar.success('course.navItem.lessons.activities.package.unchanged');
    reset();
    onReplaced?.();
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

    if ((mode === 'upgrade' || mode === 'swap') && currentFingerprint) {
      const check = peek && peek.file === selected ? peek : await readPeek(selected);
      if (check.verdict === 'same_file') {
        finishUnchanged();
        return;
      }
      if (uploadBlocked) return;
    }

    await proceedUpload();
  }

  async function proceedUpload() {
    const selected = file;
    if (!selected || phase === 'uploading' || phase === 'processing') return;

    phase = 'uploading';
    progress = 0;
    errorKey = null;
    abortController = new AbortController();

    try {
      if (mode === 'upgrade') {
        await uploadNewVersion(selected, abortController.signal);
      } else {
        await uploadNewAsset(selected, abortController.signal);
      }
    } catch (error) {
      if (abortController?.signal.aborted) return;

      console.error('Package upload error:', error);
      phase = 'failed';
      errorKey = 'course.navItem.lessons.activities.package.errors.generic';
    }
  }

  function askPromoteChoice(count: number): Promise<'keep' | 'restart'> {
    promoteCount = count;
    promoteOpen = true;

    return new Promise<'keep' | 'restart'>((resolve) => {
      promoteResolver = resolve;
    });
  }

  function resolvePromoteChoice(choice: 'keep' | 'restart') {
    promoteResolver?.(choice);
    promoteResolver = null;
    promoteOpen = false;
  }

  function handlePromoteOpenChange(isOpen: boolean) {
    promoteOpen = isOpen;

    if (!isOpen) resolvePromoteChoice('keep');
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

  async function uploadNewAsset(selected: File, signal: AbortSignal) {
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
          if (!activityApi.success) throw new Error('Failed to attach package');
          if (mode === 'attach') onAttached?.(created.asset.id);
          else onReplaced?.();
          return;
        }

        throw new Error('Package is not ready');
      },
      async () => {
        await resolveFailedVersionError(created.asset.id);
      }
    );
  }

  async function uploadNewVersion(selected: File, signal: AbortSignal) {
    if (!assetId) throw new Error('No package to replace');

    const startingInProgressCount = inProgressCount;
    const contentSha256 = peek?.file === selected ? (peek.contentSha256 ?? undefined) : undefined;
    const next = await packageApi.createVersion(assetId, { contentSha256 });
    if (!next) throw new Error('Failed to create package version');

    if (!next.uploadUrl) {
      finishUnchanged();
      return;
    }

    await putZip(next.uploadUrl, selected, signal);
    const jobId = await packageApi.process(assetId, next.version.id);
    if (!jobId) throw new Error('Failed to process package');

    await pollUntilDone(
      jobId,
      async (result) => {
        if (result?.unchanged) {
          finishUnchanged();
          return;
        }

        const freshCount = getFreshInProgressCount ? await getFreshInProgressCount() : startingInProgressCount;
        const hadInitialChoice = startingInProgressCount > 0;
        const newLearnersStarted = hadInitialChoice ? freshCount > startingInProgressCount : freshCount > 0;
        const deltaCount = hadInitialChoice ? freshCount - startingInProgressCount : freshCount;

        const restart =
          newLearnersStarted && deltaCount > 0
            ? (await askPromoteChoice(deltaCount)) === 'restart'
            : replaceChoice === 'restart';
        await packageApi.makeCurrent(assetId, next.version.id, restart);
        if (!packageApi.success) throw new Error('Failed to promote package version');
        onReplaced?.();
      },
      async () => {
        await resolveFailedVersionError(assetId);
      }
    );
  }

  async function pollUntilDone(
    jobId: string,
    onCompleted: (result: PackageJobResult | null) => Promise<void>,
    onFailed: () => Promise<void> = async () => {}
  ) {
    phase = 'processing';

    await new Promise<void>((resolve) => {
      stopPoller();
      poller = new JobPoller<MediaJobEnvelope>({
        fetch: () => jobsApi.getMediaJob(jobId),
        onUpdate: (envelope) => {
          const job = envelope.job as {
            status?: string;
            stage?: string | null;
            progressPercent?: number;
            result?: PackageJobResult | null;
          };
          stage = job.stage ?? null;
          if (typeof job.progressPercent === 'number') progress = job.progressPercent;

          if (job.status === 'completed') {
            stopPoller();
            void onCompleted(job.result ?? null)
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
          <p class="ui:text-muted-foreground text-sm">{formatPackageBytes(file.size)}</p>
        </div>
        <Button variant="outline" size="sm" onclick={() => selectFile(null)}>
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
          if (files[0]) selectFile(files[0]);
        }}
        onFileRejected={handleRejected}
      >
        <FileDropZone.Trigger
          label={$t('course.navItem.lessons.activities.package.drop_label')}
          formatMaxSize={() => $t('course.navItem.lessons.activities.package.drop_hint', { size: formatMaxSize() })}
        />
      </FileDropZone.Root>
    {/if}

    {#if (mode === 'upgrade' || mode === 'swap') && file}
      {#if peeking && (!peek || peek.file !== file)}
        <p class="ui:text-muted-foreground mt-4 text-xs">
          {$t('course.navItem.lessons.activities.package.peek_checking')}
        </p>
      {:else if peek && peek.file === file}
        <Alert.Root
          variant={identityMismatch ? 'warning' : peek.verdict === 'same_file' ? 'information' : 'default'}
          class="mt-4"
          data-testid="activity-package-peek"
        >
          {#if identityMismatch}
            <TriangleAlertIcon class="custom" />
          {:else}
            <InfoIcon class="custom" />
          {/if}
          <Alert.Description>
            {#if peek.verdict === 'same_file'}
              {$t('course.navItem.lessons.activities.package.peek_same_file')}
            {:else if peek.verdict === 'unknown'}
              {$t('course.navItem.lessons.activities.package.peek_unknown')}
            {:else if mode === 'upgrade' && peek.verdict === 'different_course'}
              {$t('course.navItem.lessons.activities.package.peek_diff', {
                title: peek.title ?? file.name,
                count: peek.count
              })}
            {:else if mode === 'swap' && peek.verdict === 'same_course'}
              {$t('course.navItem.lessons.activities.package.peek_same_course', {
                title: peek.title ?? file.name,
                count: peek.count
              })}
            {:else if mode === 'swap'}
              {$t('course.navItem.lessons.activities.package.peek_swap_ok', {
                title: peek.title ?? file.name,
                count: peek.count
              })}
            {:else}
              {$t('course.navItem.lessons.activities.package.peek_match', {
                title: peek.title ?? file.name,
                count: peek.count
              })}
            {/if}
          </Alert.Description>
          {#if identityMismatch}
            <div class="col-start-2 mt-3 flex flex-wrap items-center gap-4">
              {#if mode === 'upgrade'}
                <Button variant="outline" size="sm" onclick={() => onSwapRequest?.()}>
                  {$t('course.navItem.lessons.activities.package.swap_package')}
                </Button>
              {:else}
                <Button variant="outline" size="sm" onclick={() => onUpgradeRequest?.()}>
                  {$t('course.navItem.lessons.activities.package.upload_new_version')}
                </Button>
              {/if}
              <div class="flex items-center gap-2">
                <Checkbox
                  id="package-identity-confirm"
                  checked={acknowledged}
                  onCheckedChange={(checked) => setAcknowledged(checked === true)}
                  data-testid="activity-package-identity-confirm"
                />
                <Label for="package-identity-confirm" class="text-sm font-normal">
                  {mode === 'upgrade'
                    ? $t('course.navItem.lessons.activities.package.confirm_upgrade_anyway')
                    : $t('course.navItem.lessons.activities.package.confirm_swap_anyway')}
                </Label>
              </div>
            </div>
          {/if}
        </Alert.Root>
      {/if}
    {/if}

    {#if mode === 'upgrade' && inProgressCount > 0 && !(peek?.file === file && peek.verdict === 'same_file')}
      <div class="mt-4 space-y-2">
        <p class="text-sm font-medium">
          {$t('course.navItem.lessons.activities.package.replace_choice_title')}
        </p>
        <RadioGroup.Root bind:value={replaceChoice} class="space-y-3">
          <div class="flex items-start gap-2 text-sm">
            <RadioGroup.Item value="keep" id="replace-keep" class="mt-1" />
            <div>
              <Label for="replace-keep" class="font-medium">
                {$t('course.navItem.lessons.activities.package.replace_keep')}
              </Label>
              <p class="ui:text-muted-foreground text-xs">
                {$t('course.navItem.lessons.activities.package.replace_keep_hint', { count: inProgressCount })}
              </p>
            </div>
          </div>
          <div class="flex items-start gap-2 text-sm">
            <RadioGroup.Item value="restart" id="replace-restart" class="mt-1" />
            <div>
              <Label for="replace-restart" class="font-medium">
                {$t('course.navItem.lessons.activities.package.replace_restart')}
              </Label>
              <p class="ui:text-muted-foreground text-xs">
                {$t('course.navItem.lessons.activities.package.replace_restart_hint', { count: inProgressCount })}
              </p>
            </div>
          </div>
        </RadioGroup.Root>
      </div>
    {/if}

    {#if file}
      <div class="mt-4 flex justify-end">
        <Button onclick={startUpload} disabled={!file || uploadBlocked}>
          {#if mode === 'attach'}
            {$t('course.navItem.lessons.add_content_create')}
          {:else if mode === 'upgrade'}
            {$t('course.navItem.lessons.activities.package.upload_new_version')}
          {:else}
            {$t('course.navItem.lessons.activities.package.swap_package')}
          {/if}
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

  <Dialog.Root open={promoteOpen} onOpenChange={handlePromoteOpenChange}>
    <Dialog.Content class="sm:max-w-md">
      <Dialog.Header>
        <Dialog.Title>{$t('course.navItem.lessons.activities.package.promote_confirm_title')}</Dialog.Title>
        <Dialog.Description>
          {$t('course.navItem.lessons.activities.package.promote_confirm_body', { count: promoteCount })}
        </Dialog.Description>
      </Dialog.Header>
      <Dialog.Footer class="flex flex-col gap-2 sm:flex-col">
        <Button
          class="h-auto w-full py-2.5 text-center whitespace-normal"
          onclick={() => resolvePromoteChoice('restart')}
        >
          {$t('course.navItem.lessons.activities.package.replace_restart')}
        </Button>
        <Button
          variant="outline"
          class="h-auto w-full py-2.5 text-center whitespace-normal"
          onclick={() => resolvePromoteChoice('keep')}
        >
          {$t('course.navItem.lessons.activities.package.replace_keep')}
        </Button>
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Root>
</div>
