<script lang="ts">
  import { onDestroy } from 'svelte';
  import {
    getExerciseQuestionLabel,
    getVideoRecordingMaxDurationSeconds,
    type ExerciseQuestionRendererProps
  } from '@cio/question-types';
  import { Button } from '../../../../base/button';
  import * as Select from '../../../../base/select';
  import { Spinner } from '../../../../base/spinner';
  import { formatSeconds } from './format';

  type RecordingState =
    | 'idle'
    | 'permission_denied'
    | 'ready'
    | 'recording'
    | 'recorded'
    | 'uploading'
    | 'uploaded'
    | 'failed';

  let {
    question,
    answer = null,
    disabled = false,
    labels,
    onAnswerChange = () => {},
    onVideoRecordingUpload
  }: ExerciseQuestionRendererProps = $props();

  let recordingState = $state<RecordingState>('idle');
  let stream = $state<MediaStream | null>(null);
  let mediaRecorder = $state<MediaRecorder | null>(null);
  let liveVideo = $state<HTMLVideoElement | null>(null);
  let previewVideo = $state<HTMLVideoElement | null>(null);
  let elapsedSeconds = $state(0);
  let durationSeconds = $state(0);
  let recordingBlob = $state<Blob | null>(null);
  let previewUrl = $state('');
  let uploadError = $state('');
  let recordedAt = $state('');
  let retakeCount = $state(0);
  let isPreviewPlaying = $state(false);
  let cameraDevices = $state<MediaDeviceInfo[]>([]);
  let selectedCameraDeviceId = $state('');
  let timerId: number | null = null;
  let recordingStartedAt = 0;
  let chunks: Blob[] = [];

  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);
  const maxDurationSeconds = $derived(getVideoRecordingMaxDurationSeconds(question.settings));
  const remainingSeconds = $derived(Math.max(0, maxDurationSeconds - elapsedSeconds));
  const isFinalWarning = $derived(maxDurationSeconds > 15 && remainingSeconds <= 10 && recordingState === 'recording');
  const savedRecording = $derived(answer?.type === 'VIDEO_RECORDING' ? answer : null);
  const savedPlaybackUrl = $derived.by(() => {
    if (!savedRecording) return '';
    return savedRecording.playbackUrl ?? (savedRecording as { fileUrl?: string }).fileUrl ?? '';
  });
  const canUseRecording = $derived(recordingBlob && durationSeconds >= 1 && !disabled);
  const recordingProgressPercent = $derived(
    maxDurationSeconds > 0 ? Math.min(100, Math.max(0, (elapsedSeconds / maxDurationSeconds) * 100)) : 0
  );
  const recordingProgressDegrees = $derived(recordingProgressPercent * 3.6);
  const progressRingBackground = $derived(
    `conic-gradient(var(--primary) ${recordingProgressDegrees}deg, color-mix(in oklab, var(--primary) 12%, var(--background)) ${recordingProgressDegrees}deg)`
  );

  const isSupported = $derived.by(
    () =>
      typeof window !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      !!navigator.mediaDevices?.getUserMedia &&
      'MediaRecorder' in window
  );

  $effect(() => {
    if (liveVideo && stream) {
      liveVideo.srcObject = stream;
    }
  });

  function getSupportedMimeType(): string {
    const candidates = ['video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
    const supported = candidates.find((mimeType) => MediaRecorder.isTypeSupported(mimeType));
    return supported ?? '';
  }

  function normalizeMimeType(mimeType: string): 'video/webm' | 'video/mp4' | 'video/quicktime' {
    if (mimeType.includes('mp4')) return 'video/mp4';
    if (mimeType.includes('quicktime')) return 'video/quicktime';
    return 'video/webm';
  }

  async function refreshCameraDevices() {
    if (!navigator.mediaDevices?.enumerateDevices) return;

    const devices = await navigator.mediaDevices.enumerateDevices();
    cameraDevices = devices.filter((device) => device.kind === 'videoinput');

    if (!selectedCameraDeviceId && cameraDevices[0]) {
      selectedCameraDeviceId = cameraDevices[0].deviceId;
    }
  }

  function getVideoConstraints(): MediaTrackConstraints {
    if (selectedCameraDeviceId) {
      return { deviceId: { exact: selectedCameraDeviceId } };
    }

    return { facingMode: 'user' };
  }

  function clearTimer() {
    if (timerId === null) return;

    window.clearInterval(timerId);
    timerId = null;
  }

  function stopStream() {
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
    if (liveVideo) liveVideo.srcObject = null;
  }

  function revokePreviewUrl() {
    if (!previewUrl) return;

    URL.revokeObjectURL(previewUrl);
    previewUrl = '';
  }

  function resetLocalRecording() {
    revokePreviewUrl();
    recordingBlob = null;
    durationSeconds = 0;
    elapsedSeconds = 0;
    uploadError = '';
    isPreviewPlaying = false;
  }

  async function requestCamera(): Promise<MediaStream | null> {
    if (disabled || !isSupported) return null;

    try {
      stopStream();
      const nextStream = await navigator.mediaDevices.getUserMedia({
        video: getVideoConstraints(),
        audio: true
      });
      stream = nextStream;
      selectedCameraDeviceId = nextStream.getVideoTracks()[0]?.getSettings().deviceId ?? selectedCameraDeviceId;
      recordingState = 'ready';
      uploadError = '';
      await refreshCameraDevices();
      return nextStream;
    } catch {
      recordingState = 'permission_denied';
      return null;
    }
  }

  async function handleCameraChange(nextDeviceId: string) {
    if (!nextDeviceId || nextDeviceId === selectedCameraDeviceId || recordingState === 'recording') return;

    selectedCameraDeviceId = nextDeviceId;
    if (recordingState === 'ready') {
      await requestCamera();
    }
  }

  async function startRecording() {
    if (disabled || recordingState === 'recording') return;

    const activeStream = stream ?? (await requestCamera());
    if (!activeStream) return;

    resetLocalRecording();
    chunks = [];
    const mimeType = getSupportedMimeType();
    const recorder = new MediaRecorder(activeStream, mimeType ? { mimeType } : undefined);
    mediaRecorder = recorder;
    recordingStartedAt = performance.now();
    recordedAt = new Date().toISOString();

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };

    recorder.onstop = () => {
      clearTimer();
      const measuredDuration = Math.max(0, (performance.now() - recordingStartedAt) / 1000);
      durationSeconds = Math.round(measuredDuration * 10) / 10;
      elapsedSeconds = Math.min(maxDurationSeconds, Math.ceil(durationSeconds));
      const blobType = normalizeMimeType(recorder.mimeType || mimeType);
      const blob = new Blob(chunks, { type: blobType });
      recordingBlob = blob;
      previewUrl = URL.createObjectURL(blob);
      recordingState = durationSeconds >= 1 ? 'recorded' : 'failed';
    };

    recorder.start();
    recordingState = 'recording';
    timerId = window.setInterval(() => {
      const elapsed = (performance.now() - recordingStartedAt) / 1000;
      elapsedSeconds = Math.min(maxDurationSeconds, elapsed);
      if (elapsed >= maxDurationSeconds) {
        stopRecording();
      }
    }, 250);
  }

  function stopRecording() {
    if (mediaRecorder?.state === 'recording') {
      mediaRecorder.stop();
    }
    clearTimer();
    stopStream();
  }

  async function togglePreviewPlayback() {
    if (!previewVideo) return;

    if (previewVideo.paused) {
      await previewVideo.play();
      isPreviewPlaying = true;
      return;
    }

    previewVideo.pause();
    isPreviewPlaying = false;
  }

  function onPreviewEnded() {
    isPreviewPlaying = false;
  }

  function retakeRecording() {
    resetLocalRecording();
    retakeCount += 1;
    recordingState = stream ? 'ready' : 'idle';
  }

  function deleteRecording() {
    resetLocalRecording();
    onAnswerChange(null);
    recordingState = stream ? 'ready' : 'idle';
  }

  async function acceptRecording() {
    if (!recordingBlob || !canUseRecording || !onVideoRecordingUpload) return;

    recordingState = 'uploading';
    uploadError = '';

    try {
      const mimeType = normalizeMimeType(recordingBlob.type);
      const result = await onVideoRecordingUpload({
        questionId: question.id ?? question.key ?? '',
        blob: recordingBlob,
        fileName: `recording-${Date.now()}.${mimeType === 'video/mp4' ? 'mp4' : 'webm'}`,
        mimeType,
        size: recordingBlob.size,
        durationSeconds,
        recordedAt,
        retakeCount
      });

      onAnswerChange({ ...result, playbackUrl: previewUrl });
      recordingState = 'uploaded';
    } catch (error) {
      uploadError =
        error instanceof Error
          ? error.message
          : label('video_recording.take.upload_failed', 'Upload failed. Try again.');
      recordingState = 'failed';
    }
  }

  onDestroy(() => {
    clearTimer();
    stopStream();
    revokePreviewUrl();
  });
</script>

<div class="ui:space-y-4" aria-live="polite">
  {#if !isSupported}
    <p class="ui:text-muted-foreground ui:text-sm">
      {label('video_recording.take.unsupported', 'Video recording is not supported in this browser.')}
    </p>
  {:else}
    <div class="ui:flex ui:flex-col ui:items-center ui:gap-4">
      <div
        class={recordingState === 'recording' ? 'ui:rounded-full ui:p-1 ui:shadow-sm' : ''}
        style={recordingState === 'recording' ? `background: ${progressRingBackground};` : undefined}
      >
        <div
          class="ui:bg-muted ui:relative ui:grid ui:aspect-square ui:w-52 ui:max-w-full ui:place-items-center ui:overflow-hidden ui:rounded-full ui:sm:w-64"
        >
          {#if recordingState === 'ready' || recordingState === 'recording'}
            <video
              bind:this={liveVideo}
              autoplay
              muted
              playsinline
              class="ui:h-full ui:w-full ui:object-cover ui:[transform:scaleX(-1)]"
            ></video>
            {#if recordingState === 'ready'}
              <button
                type="button"
                class="ui:absolute ui:inset-0 ui:grid ui:place-items-center ui:bg-black/10 ui:text-white ui:transition ui:hover:bg-black/20 ui:focus-visible:outline-none ui:focus-visible:ring-2 ui:focus-visible:ring-ring ui:disabled:pointer-events-none ui:disabled:opacity-50"
                {disabled}
                onclick={startRecording}
              >
                <span
                  class="ui:rounded-full ui:bg-background/90 ui:px-4 ui:py-2 ui:text-sm ui:font-medium ui:text-foreground ui:shadow-md"
                >
                  {label('video_recording.take.start_recording', 'Start recording')}
                </span>
              </button>
            {/if}
          {:else if previewUrl || savedPlaybackUrl}
            <!-- svelte-ignore a11y_media_has_caption - v1 browser recordings do not generate captions. -->
            <video
              bind:this={previewVideo}
              src={previewUrl || savedPlaybackUrl}
              playsinline
              class="ui:h-full ui:w-full ui:object-cover ui:[transform:scaleX(-1)]"
              onpause={() => (isPreviewPlaying = false)}
              onplay={() => (isPreviewPlaying = true)}
              onended={onPreviewEnded}
            ></video>
            <button
              type="button"
              class="ui:group ui:absolute ui:inset-0 ui:grid ui:place-items-center ui:bg-black/10 ui:text-white ui:transition ui:hover:bg-black/20 ui:focus-visible:outline-none ui:focus-visible:ring-2 ui:focus-visible:ring-ring"
              aria-label={isPreviewPlaying
                ? label('video_recording.take.pause_preview', 'Pause recording preview')
                : label('video_recording.take.play_preview', 'Play recording preview')}
              onclick={togglePreviewPlayback}
            >
              {#if isPreviewPlaying}
                <span
                  class="ui:grid ui:size-14 ui:grid-cols-[6px_6px] ui:place-content-center ui:gap-2 ui:rounded-full ui:bg-background/90 ui:text-foreground ui:opacity-0 ui:shadow-md ui:transition-opacity ui:group-hover:opacity-100 ui:group-focus-visible:opacity-100"
                  aria-hidden="true"
                >
                  <span class="ui:h-5 ui:w-1.5 ui:rounded-sm ui:bg-current"></span>
                  <span class="ui:h-5 ui:w-1.5 ui:rounded-sm ui:bg-current"></span>
                </span>
              {:else}
                <span
                  class="ui:grid ui:size-14 ui:place-items-center ui:rounded-full ui:bg-background/90 ui:text-foreground ui:shadow-md"
                  aria-hidden="true"
                >
                  <span
                    class="ui:ml-1 ui:h-0 ui:w-0 ui:border-y-[10px] ui:border-y-transparent ui:border-l-[16px] ui:border-l-current"
                  ></span>
                </span>
              {/if}
            </button>
          {:else if recordingState === 'permission_denied'}
            <div class="ui:flex ui:max-w-40 ui:flex-col ui:items-center ui:gap-3 ui:text-center">
              <p class="ui:text-sm ui:text-muted-foreground">
                {label('video_recording.take.permission_denied', 'Camera or microphone access was blocked.')}
              </p>
              <Button type="button" size="sm" variant="secondary" {disabled} onclick={requestCamera}>
                {label('video_recording.take.start_camera', 'Set up camera')}
              </Button>
            </div>
          {:else}
            <button
              type="button"
              class="ui:grid ui:size-24 ui:place-items-center ui:rounded-full ui:bg-background ui:px-3 ui:text-center ui:text-sm ui:font-medium ui:text-foreground ui:shadow-sm ui:ring-1 ui:ring-border ui:transition ui:hover:bg-accent ui:focus-visible:outline-none ui:focus-visible:ring-2 ui:focus-visible:ring-ring ui:disabled:pointer-events-none ui:disabled:opacity-50"
              {disabled}
              onclick={requestCamera}
            >
              {label('video_recording.take.start_camera', 'Set up camera')}
            </button>
          {/if}
        </div>
      </div>

      {#if cameraDevices.length > 1 && recordingState !== 'recording'}
        <div class="ui:flex ui:w-full ui:max-w-xs ui:flex-col ui:gap-1.5">
          <span class="ui:text-xs ui:font-medium ui:text-muted-foreground">
            {label('video_recording.take.camera_label', 'Camera')}
          </span>
          <Select.Root type="single" value={selectedCameraDeviceId} onValueChange={handleCameraChange}>
            <Select.Trigger class="ui:w-full">
              {cameraDevices.find((device) => device.deviceId === selectedCameraDeviceId)?.label ||
                label('video_recording.take.camera_placeholder', 'Select camera')}
            </Select.Trigger>
            <Select.Content>
              {#each cameraDevices as device, cameraIndex (device.deviceId)}
                <Select.Item value={device.deviceId} label={device.label || `Camera ${cameraIndex + 1}`}>
                  {device.label || `${label('video_recording.take.camera_label', 'Camera')} ${cameraIndex + 1}`}
                </Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </div>
      {/if}

      <div class="ui:flex ui:flex-wrap ui:items-center ui:justify-center ui:gap-x-4 ui:gap-y-1 ui:text-sm">
        <span class={isFinalWarning ? 'ui:text-destructive ui:font-medium' : 'ui:text-muted-foreground'}>
          {label('video_recording.take.elapsed', 'Elapsed')}: {formatSeconds(elapsedSeconds)}
        </span>
        <span class={isFinalWarning ? 'ui:text-destructive ui:font-medium' : 'ui:text-muted-foreground'}>
          {label('video_recording.take.remaining', 'Remaining')}: {formatSeconds(remainingSeconds)}
        </span>
        <span class="ui:text-muted-foreground">
          {label('video_recording.take.max_duration', 'Max')}: {formatSeconds(maxDurationSeconds)}
        </span>
      </div>

      {#if recordingState === 'failed' && durationSeconds < 1 && recordingBlob}
        <p class="ui:text-destructive ui:text-sm">
          {label('video_recording.take.too_short', 'Record for at least 1 second.')}
        </p>
      {/if}

      {#if uploadError}
        <p class="ui:text-destructive ui:text-sm">{uploadError}</p>
      {/if}

      {#if savedRecording && recordingState !== 'recording' && recordingState !== 'uploading'}
        <p class="ui:text-muted-foreground ui:text-sm">
          {label('video_recording.take.uploaded', 'Recording uploaded')}
        </p>
      {/if}

      {#if savedRecording && recordingState === 'recorded'}
        <p class="ui:text-muted-foreground ui:text-sm">
          {label(
            'video_recording.take.replaces_previous',
            'A new accepted take replaces the previous answer after upload.'
          )}
        </p>
      {/if}

      <div class="ui:flex ui:flex-wrap ui:justify-center ui:gap-2">
        {#if savedRecording && (recordingState === 'idle' || recordingState === 'uploaded')}
          <Button type="button" variant="outline" {disabled} onclick={startRecording}>
            {label('video_recording.take.retake', 'Retake')}
          </Button>
          <Button type="button" variant="ghost" {disabled} onclick={deleteRecording}>
            {label('video_recording.take.delete', 'Delete recording')}
          </Button>
        {:else if recordingState === 'recording'}
          <Button type="button" variant="destructive" {disabled} onclick={stopRecording}>
            {label('video_recording.take.stop_recording', 'Stop recording')}
          </Button>
        {:else if recordingState === 'recorded' || recordingState === 'failed'}
          <Button type="button" disabled={!canUseRecording} onclick={acceptRecording}>
            {label(
              recordingState === 'failed' && uploadError
                ? 'video_recording.take.retry_upload'
                : 'video_recording.take.use_recording',
              recordingState === 'failed' && uploadError ? 'Retry upload' : 'Use recording'
            )}
          </Button>
          <Button type="button" variant="ghost" {disabled} onclick={retakeRecording}>
            {label('video_recording.take.retake', 'Retake')}
          </Button>
          {#if savedRecording}
            <Button type="button" variant="ghost" {disabled} onclick={deleteRecording}>
              {label('video_recording.take.delete', 'Delete recording')}
            </Button>
          {/if}
        {:else if recordingState === 'uploading'}
          <Button type="button" disabled>
            <Spinner class="ui:size-4" />
            {label('video_recording.take.uploading', 'Uploading recording...')}
          </Button>
        {/if}
      </div>
    </div>
  {/if}
</div>
