import type { Job } from 'bullmq';
import { spawn } from 'child_process';
import { createWriteStream, createReadStream, mkdir, rm } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { downloadFromS3, uploadToS3 } from '../../utils/s3';
import { queueEnv } from '../../config/env';

export interface ProcessVideoUploadJobData {
  fileKey: string;
  fileName: string;
  fileType: string;
  userId?: string;
  lessonId?: string;
  organizationId?: string;
  metadata?: Record<string, any>;
}

interface VideoMetadata {
  duration: number;
  totalSegments: number;
  segmentFiles: string[];
}

async function processVideoForHLS(videoBuffer: Buffer, fileKey: string): Promise<VideoMetadata> {
  const tempDir = tmpdir();
  const inputPath = join(tempDir, `input_${Date.now()}_${fileKey.replace(/\//g, '_')}.mp4`);
  const outputDir = join(tempDir, `output_${Date.now()}_${fileKey.replace(/\//g, '_')}`);
  const manifestPath = join(outputDir, 'playlist.m3u8');

  try {
    // 1. Write video buffer to temporary file
    await new Promise<void>((resolve, reject) => {
      const writeStream = createWriteStream(inputPath);
      writeStream.write(videoBuffer);
      writeStream.end();
      writeStream.on('finish', () => resolve());
      writeStream.on('error', reject);
    });

    // 2. Create output directory
    await new Promise<void>((resolve, reject) => {
      mkdir(outputDir, { recursive: true }, (err: any) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // 3. Run FFmpeg segmentation
    await new Promise<void>((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i',
        inputPath,
        '-c:v',
        'libx264',
        '-preset',
        'fast',
        '-crf',
        '23',
        '-c:a',
        'aac',
        '-b:a',
        '128k',
        '-f',
        'hls',
        '-hls_time',
        '10',
        '-hls_list_size',
        '0',
        '-hls_segment_filename',
        join(outputDir, 'segment_%03d.ts'),
        '-y',
        manifestPath
      ]);

      const timeout = setTimeout(
        () => {
          ffmpeg.kill('SIGTERM');
          reject(new Error('FFmpeg processing timeout after 10 minutes'));
        },
        10 * 60 * 1000
      );

      ffmpeg.stderr?.on('data', () => {
        // FFmpeg outputs progress to stderr (silently consumed)
      });

      ffmpeg.on('close', (code) => {
        clearTimeout(timeout);
        if (code === 0) resolve();
        else reject(new Error(`FFmpeg exited with code ${code}`));
      });

      ffmpeg.on('error', (error) => {
        clearTimeout(timeout);
        console.error('FFmpeg spawn error:', error);
        reject(error);
      });
    });

    // 4. Read manifest and parse segments
    const manifest = await new Promise<string>((resolve, reject) => {
      const readStream = createReadStream(manifestPath, 'utf8');
      let content = '';
      readStream.on('data', (chunk) => (content += chunk));
      readStream.on('end', () => resolve(content));
      readStream.on('error', reject);
    });

    // 5. Parse manifest to get segment filenames
    const segmentFiles: string[] = [];
    const lines = manifest.split('\n');
    let totalDuration = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('#EXTINF:')) {
        const duration = parseFloat(line.split(':')[1].split(',')[0]);
        totalDuration += duration;
        const nextLine = lines[i + 1]?.trim();
        if (nextLine && !nextLine.startsWith('#')) {
          segmentFiles.push(nextLine);
        }
      }
    }

    // 6. Upload segments to S3
    const bucket = queueEnv.CLOUDFLARE_BUCKET_NAME || 'videos';
    const uploadedSegments: string[] = [];

    for (let i = 0; i < segmentFiles.length; i++) {
      const segmentFile = segmentFiles[i];
      const segmentPath = join(outputDir, segmentFile);

      // Read segment file
      const segmentBuffer = await new Promise<Buffer>((resolve, reject) => {
        const readStream = createReadStream(segmentPath);
        const chunks: Buffer[] = [];
        readStream.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        readStream.on('end', () => resolve(Buffer.concat(chunks)));
        readStream.on('error', reject);
      });

      // Upload segment
      const segmentKey = `${fileKey}/segments/${segmentFile}`;

      await uploadToS3({
        Bucket: bucket,
        Key: segmentKey,
        Body: segmentBuffer,
        ContentType: 'video/mp2t'
      });

      uploadedSegments.push(segmentKey);

      console.log(`Uploaded segment ${i + 1}/${segmentFiles.length}: ${segmentFile}`);
    }

    // 7. Upload manifest
    const manifestKey = `${fileKey}/playlist.m3u8`;

    await uploadToS3({
      Bucket: bucket,
      Key: manifestKey,
      Body: Buffer.from(manifest, 'utf8'),
      ContentType: 'application/vnd.apple.mpegurl'
    });

    // 8. Clean up temp files
    await cleanup([inputPath, outputDir]);

    return {
      duration: totalDuration,
      totalSegments: segmentFiles.length,
      segmentFiles: uploadedSegments
    };
  } catch (error) {
    // Clean up on error
    await cleanup([inputPath, outputDir]);
    throw error;
  }
}

async function cleanup(paths: string[]): Promise<void> {
  for (const filePath of paths) {
    try {
      await new Promise<void>((resolve, reject) => {
        rm(filePath, { recursive: true, force: true }, (err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });
    } catch (error) {
      // Silently ignore cleanup errors
    }
  }
}

export async function ProcessVideoUploadJob(job: Job<ProcessVideoUploadJobData>) {
  const { fileKey, fileName, fileType, userId, lessonId, organizationId, metadata } = job.data;

  await job.updateProgress(10);

  try {
    // 1. Download video from S3
    await job.updateProgress(20);
    const bucket = queueEnv.CLOUDFLARE_BUCKET_NAME || metadata?.bucket || 'videos';

    const videoBuffer = await downloadFromS3(bucket, fileKey);

    // 2. Process video for HLS
    await job.updateProgress(30);
    const videoMetadata = await processVideoForHLS(videoBuffer, fileKey);

    await job.updateProgress(90);
    await job.updateProgress(100);

    return {
      success: true,
      fileKey,
      fileName,
      metadata: {
        duration: videoMetadata.duration,
        segmentCount: videoMetadata.totalSegments,
        processedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error processing video for HLS:', error);
    throw error;
  }
}
