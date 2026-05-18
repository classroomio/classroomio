import { JOB_NAMES, QUEUE_NAMES } from '../queues/names';
import { QUEUE_DEFAULTS } from '../queues/defaults';
import { getFlowProducer, getQueue } from '../queues/factories';
import type { TActorContext } from '../payloads/media';

export interface EnqueueLessonVideoPipelineInput {
  mediaJobId: string;
  assetId: string;
  storageKey: string;
  actorContext: TActorContext;
  /** Skip transcription (e.g. when no OpenAI key is configured). */
  withTranscription?: boolean;
}

export interface EnqueueLessonVideoPipelineResult {
  /** BullMQ job id of the parent (transcribe-audio if enabled, otherwise generate-thumbnail). */
  rootJobId: string;
  /** All BullMQ job ids enqueued, keyed by job name. */
  jobIds: Record<string, string>;
}

function collectFlowJobIds(
  tree: Awaited<ReturnType<ReturnType<typeof getFlowProducer>['add']>>
): Record<string, string> {
  const jobIds: Record<string, string> = {};
  const visit = (node: typeof tree | undefined): void => {
    if (!node) return;

    jobIds[node.job.name] = node.job.id ?? '';
    node.children?.forEach(visit);
  };

  visit(tree);
  return jobIds;
}

/**
 * Enqueue the lesson-video post-processing pipeline.
 *
 * The flow looks like this:
 *
 *   transcribe-audio (media-transcribe)            <- parent
 *     └── extract-audio  (media)                   <- child
 *           └── generate-thumbnail (media)         <- grandchild (sequential)
 *                 └── probe-metadata (media)       <- runs first
 *
 * BullMQ runs children before parents, so probe runs first, then thumbnail,
 * then audio extract, then the transcription provider call. Each step is
 * retried independently. If transcription is disabled we drop the
 * transcribe + extract-audio nodes and use generate-thumbnail as the root.
 *
 * Each node payload is intentionally small — workers re-fetch the media_job
 * + asset rows from the DB to get the latest state.
 */
export async function enqueueLessonVideoPipeline(
  input: EnqueueLessonVideoPipelineInput
): Promise<EnqueueLessonVideoPipelineResult> {
  const { mediaJobId, assetId, storageKey, actorContext, withTranscription = true } = input;

  const sharedData = { mediaJobId, assetId, storageKey, actorContext };
  const flow = getFlowProducer();

  if (!withTranscription) {
    const job = await getQueue(QUEUE_NAMES.media).add(
      JOB_NAMES.media.generateThumbnail,
      sharedData,
      QUEUE_DEFAULTS[QUEUE_NAMES.media]
    );
    const probe = await getQueue(QUEUE_NAMES.media).add(
      JOB_NAMES.media.probeMetadata,
      sharedData,
      QUEUE_DEFAULTS[QUEUE_NAMES.media]
    );

    return {
      rootJobId: job.id ?? '',
      jobIds: {
        [JOB_NAMES.media.generateThumbnail]: job.id ?? '',
        [JOB_NAMES.media.probeMetadata]: probe.id ?? ''
      }
    };
  }

  const tree = await flow.add({
    name: JOB_NAMES.mediaTranscribe.transcribeAudio,
    queueName: QUEUE_NAMES.mediaTranscribe,
    data: { mediaJobId, assetId, actorContext },
    opts: QUEUE_DEFAULTS[QUEUE_NAMES.mediaTranscribe],
    children: [
      {
        name: JOB_NAMES.media.extractAudio,
        queueName: QUEUE_NAMES.media,
        data: sharedData,
        opts: QUEUE_DEFAULTS[QUEUE_NAMES.media],
        children: [
          {
            name: JOB_NAMES.media.generateThumbnail,
            queueName: QUEUE_NAMES.media,
            data: sharedData,
            opts: QUEUE_DEFAULTS[QUEUE_NAMES.media],
            children: [
              {
                name: JOB_NAMES.media.probeMetadata,
                queueName: QUEUE_NAMES.media,
                data: sharedData,
                opts: QUEUE_DEFAULTS[QUEUE_NAMES.media]
              }
            ]
          }
        ]
      }
    ]
  });

  return {
    rootJobId: tree.job.id ?? '',
    jobIds: collectFlowJobIds(tree)
  };
}

/**
 * Enqueue only extract-audio → transcribe-audio (new `media_job` row required).
 * Used for manual “generate transcript” when the initial pipeline had no OpenAI key.
 */
export async function enqueueTranscriptionOnly(input: {
  mediaJobId: string;
  assetId: string;
  storageKey: string;
  actorContext: TActorContext;
}): Promise<EnqueueLessonVideoPipelineResult> {
  const { mediaJobId, assetId, storageKey, actorContext } = input;
  const sharedData = { mediaJobId, assetId, storageKey, actorContext };
  const flow = getFlowProducer();

  const tree = await flow.add({
    name: JOB_NAMES.mediaTranscribe.transcribeAudio,
    queueName: QUEUE_NAMES.mediaTranscribe,
    data: { mediaJobId, assetId, actorContext },
    opts: QUEUE_DEFAULTS[QUEUE_NAMES.mediaTranscribe],
    children: [
      {
        name: JOB_NAMES.media.extractAudio,
        queueName: QUEUE_NAMES.media,
        data: sharedData,
        opts: QUEUE_DEFAULTS[QUEUE_NAMES.media]
      }
    ]
  });

  return {
    rootJobId: tree.job.id ?? '',
    jobIds: collectFlowJobIds(tree)
  };
}
