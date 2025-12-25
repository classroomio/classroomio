import { Worker } from 'bullmq';
import { redis } from '@api/utils/redis/redis';
import { videoProcessingQueue } from './queue';
import { encodeVideoToHLS } from './encoder';
import { generateCaptionsWithAPI, extractAudio } from './captions';
import { downloadVideoFromR2, uploadFileToR2, getR2PublicUrl } from './storage';
import { BUCKET_NAME } from '@api/constants/upload';
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdir, rm } from 'fs/promises';
import type { VideoEncodingJob, VideoProcessingResult } from './types';

// Initialize worker only if Redis is available
let videoWorker: Worker<VideoEncodingJob> | null = null;

try {
  videoWorker = new Worker<VideoEncodingJob>(
    'video-encoding',
    async (job) => {
    const { fileKey, userId, language } = job.data;
    const tempDir = join(tmpdir(), `video-${job.id}`);

    try {
      await mkdir(tempDir, { recursive: true });

      // Download video from R2
      await job.updateProgress(5);
      const videoBuffer = await downloadVideoFromR2(fileKey);
      const videoPath = join(tempDir, 'input.mp4');
      await require('fs/promises').writeFile(videoPath, videoBuffer);

      // Extract audio for transcription
      await job.updateProgress(10);
      const audioPath = join(tempDir, 'audio.mp3');
      await extractAudio(videoPath, audioPath);

      // Generate captions (can run in parallel with encoding)
      await job.updateProgress(15);
      const captionPromise = generateCaptionsWithAPI(audioPath, {
        language: language || 'en',
        model: 'base',
      }).catch((error) => {
        console.error(`Caption generation failed for ${fileKey}:`, error);
        // Return empty captions if generation fails
        return {
          transcript: '',
          language: language || 'en',
          duration: 0,
          srtContent: '',
          vttContent: '',
        };
      });

      // Encode video to HLS
      await job.updateProgress(20);
      const hlsResult = await encodeVideoToHLS(videoBuffer, fileKey, tempDir);

      // Wait for captions
      await job.updateProgress(80);
      const captions = await captionPromise;

      // Upload captions if generated
      let srtUrl = '';
      let vttUrl = '';

      if (captions.srtContent && captions.vttContent) {
        await job.updateProgress(85);

        const srtKey = `captions/${fileKey}.srt`;
        const vttKey = `captions/${fileKey}.vtt`;

        await uploadFileToR2(srtKey, captions.srtContent, 'text/srt');
        await uploadFileToR2(vttKey, captions.vttContent, 'text/vtt');

        srtUrl = getR2PublicUrl(srtKey);
        vttUrl = getR2PublicUrl(vttKey);
      }

      await job.updateProgress(95);

      // Return result
      const result: VideoProcessingResult = {
        manifestUrl: hlsResult.manifestUrl,
        captions: {
          srtUrl,
          vttUrl,
          transcript: captions.transcript,
          language: captions.language,
        },
        qualities: hlsResult.qualities,
        duration: captions.duration,
      };

      await job.updateProgress(100);

      return result;
    } catch (error) {
      console.error(`Video processing failed for ${fileKey}:`, error);
      throw error;
    } finally {
      // Cleanup temp files
      try {
        await rm(tempDir, { recursive: true, force: true });
      } catch (error) {
        console.error(`Failed to cleanup temp directory ${tempDir}:`, error);
      }
    }
  },
  {
    connection: redis,
    concurrency: 2, // Process 2 videos concurrently (adjust based on CPU)
    limiter: {
      max: 5, // Max 5 jobs
      duration: 60000, // per minute
    },
    }
  );

  // Handle worker events
  videoWorker.on('completed', (job) => {
    console.log(`Video encoding completed: ${job.id} (${job.data.fileKey})`);
  });

  videoWorker.on('failed', (job, err) => {
    console.error(`Video encoding failed: ${job?.id} (${job?.data.fileKey})`, err);
  });

  videoWorker.on('error', (err) => {
    console.error('Video worker error:', err);
  });

  console.log('Video processing worker initialized successfully');
} catch (error) {
  console.error('Failed to initialize video worker:', error);
  console.warn('Video processing will not be available until Redis is configured');
}

export { videoWorker };
