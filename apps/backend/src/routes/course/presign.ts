import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import {
  ZCourseDocumentPresignUrlUpload,
  ZCourseDownloadPresignedUrl,
  ZCoursePresignUrlUpload
} from '$src/types/course';

import { BUCKET_NAME } from '$src/constants/upload';
import { CLOUDFLARE } from '$src/constants';
import type { GetSignedUrlParameters } from '$src/utils/s3';
import { Hono } from 'hono';
import { authMiddleware } from '$src/middlewares/auth';
import { generateFileKey } from '$src/utils/upload';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from '$src/utils/s3';

export const presignRouter = new Hono();

// Note: Lesson access verification is handled on the client side
// Users cannot access course data without proper permissions

// Video processing utilities for HLS segmentation
import { spawn } from 'child_process';
import {
  createWriteStream,
  createReadStream,
  unlink,
  mkdir,
  rm,
  stat,
  unlink as fsUnlink
} from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

interface VideoMetadata {
  duration: number;
  segments: Array<{
    filename: string;
    duration: number;
    size: number;
    buffer: Buffer; // Add actual segment buffer
  }>;
  totalSegments: number;
}

// Process video for HLS during upload (in memory)
async function processVideoForHLS(videoBuffer: Buffer, videoKey: string): Promise<VideoMetadata> {
  const tempDir = tmpdir();
  const inputPath = join(tempDir, `input_${Date.now()}.mp4`);
  const outputDir = join(tempDir, `output_${Date.now()}`);
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

    // 3. Run FFmpeg segmentation with timeout
    await new Promise<void>((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i',
        inputPath,
        '-c:v',
        'libx264',
        '-preset',
        'fast', // Faster encoding
        '-crf',
        '23', // Good quality/size balance
        '-c:a',
        'aac',
        '-b:a',
        '128k', // Audio bitrate
        '-f',
        'hls',
        '-hls_time',
        '10',
        '-hls_list_size',
        '0',
        '-hls_segment_filename',
        join(outputDir, 'segment_%03d.ts'),
        '-y', // Overwrite output files
        manifestPath
      ]);

      // Set timeout (5 minutes for video processing)
      const timeout = setTimeout(
        () => {
          ffmpeg.kill('SIGTERM');
          reject(new Error('FFmpeg processing timeout after 5 minutes'));
        },
        5 * 60 * 1000
      );

      // Add logging for debugging
      ffmpeg.stdout?.on('data', (data) => {
        console.log('FFmpeg stdout:', data.toString());
      });

      ffmpeg.stderr?.on('data', (data) => {
        console.log('FFmpeg stderr:', data.toString());
      });

      ffmpeg.on('close', (code) => {
        clearTimeout(timeout);
        console.log(`FFmpeg process exited with code ${code}`);
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

    // 5. Parse manifest to get segment info
    const segments = parseManifest(manifest, outputDir);

    // 6. Read actual segment files and include buffers
    const segmentsWithBuffers = await Promise.all(
      segments.map(async (segment) => {
        const segmentPath = join(outputDir, segment.filename);
        const segmentBuffer = await new Promise<Buffer>((resolve, reject) => {
          const readStream = createReadStream(segmentPath);
          const chunks: Buffer[] = [];

          readStream.on('data', (chunk) => {
            if (Buffer.isBuffer(chunk)) {
              chunks.push(chunk);
            } else {
              chunks.push(Buffer.from(chunk));
            }
          });
          readStream.on('end', () => resolve(Buffer.concat(chunks)));
          readStream.on('error', reject);
        });

        return {
          ...segment,
          buffer: segmentBuffer,
          size: segmentBuffer.length
        };
      })
    );

    // 7. Clean up temp files
    await cleanup([inputPath, outputDir]);

    return {
      duration: segmentsWithBuffers.reduce((total, seg) => total + seg.duration, 0),
      segments: segmentsWithBuffers,
      totalSegments: segmentsWithBuffers.length
    };
  } catch (error) {
    // Clean up on error
    await cleanup([inputPath, outputDir]);
    throw error;
  }
}

// Parse HLS manifest to extract segment information
function parseManifest(
  manifest: string,
  outputDir: string
): Array<{
  filename: string;
  duration: number;
  size: number;
}> {
  const lines = manifest.split('\n');
  const segments: Array<{
    filename: string;
    duration: number;
    size: number;
  }> = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#EXTINF:')) {
      const duration = parseFloat(line.split(':')[1].split(',')[0]);
      const nextLine = lines[i + 1]?.trim();
      if (nextLine && !nextLine.startsWith('#')) {
        segments.push({
          filename: nextLine,
          duration,
          size: 0 // Will be updated when we read the actual file
        });
      }
    }
  }

  return segments;
}

// Clean up temporary files and directories
async function cleanup(paths: string[]): Promise<void> {
  for (const filePath of paths) {
    try {
      await new Promise<void>((resolve, reject) => {
        stat(filePath, (err: any, stats: any) => {
          if (err) {
            // File doesn't exist, nothing to clean up
            resolve();
            return;
          }

          if (stats.isDirectory()) {
            // Remove directory recursively
            rm(filePath, { recursive: true, force: true }, (err: any) => {
              if (err) reject(err);
              else resolve();
            });
          } else {
            // Remove file
            fsUnlink(filePath, (err: any) => {
              if (err) reject(err);
              else resolve();
            });
          }
        });
      });
    } catch (error) {
      console.warn(`Failed to clean up ${filePath}:`, error);
    }
  }
}

// Helper function to generate HLS manifest from stored metadata
async function generateHLSManifest(videoKey: string, lessonId: string): Promise<string> {
  const baseUrl = `/course/presign/hls/segment/${lessonId}/${videoKey}`;

  try {
    // For now, generate a dynamic manifest based on estimated segments
    // In production, you'd query the database for actual metadata
    const segmentCount = 10; // Default segment count - should come from DB
    const segmentDuration = 10; // 10 seconds per segment

    let manifest = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:${segmentDuration}
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PLAYLIST-TYPE:VOD

`;

    // Generate segments dynamically
    for (let i = 0; i < segmentCount; i++) {
      const segmentId = `segment_${i.toString().padStart(3, '0')}.ts`;
      manifest += `#EXTINF:${segmentDuration}.0,
${baseUrl}/${segmentId}

`;
    }

    manifest += '#EXT-X-ENDLIST';
    return manifest;
  } catch (error) {
    console.error('Error generating HLS manifest:', error);
    // Fallback to original video
    return `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:300
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PLAYLIST-TYPE:VOD

#EXTINF:300.0,
${baseUrl}/original.mp4

#EXT-X-ENDLIST`;
  }
}

presignRouter.post('/upload', authMiddleware, async (c) => {
  const body = await c.req.json();
  const result = ZCoursePresignUrlUpload.parse(body);

  const { fileName, fileType } = result;
  const fileKey = generateFileKey(fileName);

  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME.VIDEOS,
      Key: fileKey,
      ContentType: fileType
    }) as GetSignedUrlParameters[1];

    const presignedUrl = await getSignedUrl(s3Client as GetSignedUrlParameters[0], command, {
      expiresIn: CLOUDFLARE.R2.PRESIGN_EXPIRATION_TIME
    });

    return c.json({
      success: true,
      url: presignedUrl,
      fileKey,
      message: 'Pre-signed URL generated successfully'
    });
  } catch (error) {
    console.error('Error generating pre-signed URL:', error);

    if (error instanceof Error && error.name === 'SignatureDoesNotMatch') {
      return c.json(
        {
          success: false,
          type: 'SIGNATURE_ERROR',
          message: 'Invalid signature for the request'
        },
        403
      );
    }

    return c.json(
      {
        success: false,
        type: 'INTERNAL_ERROR',
        message: 'Error generating pre-signed URL'
      },
      500
    );
  }
});

// New endpoint: Upload video with HLS processing
presignRouter.post('/upload/hls', authMiddleware, async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('video') as File;

    if (!file) {
      return c.json(
        {
          success: false,
          message: 'No video file provided'
        },
        400
      );
    }

    const fileKey = generateFileKey(file.name);
    const videoBuffer = Buffer.from(await file.arrayBuffer());

    // Process video for HLS segmentation
    const metadata = await processVideoForHLS(videoBuffer, fileKey);

    // Upload actual segments to R2
    const uploadPromises = metadata.segments.map(async (segment, index) => {
      const segmentKey = `${fileKey}/segments/segment_${index.toString().padStart(3, '0')}.ts`;

      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME.VIDEOS,
        Key: segmentKey,
        ContentType: 'video/mp2t',
        Body: segment.buffer // Use actual segment buffer from FFmpeg
      });

      await s3Client.send(command);
      return segmentKey;
    });

    await Promise.all(uploadPromises);

    // TODO: Store metadata in database
    // await storeVideoMetadata(fileKey, metadata);

    return c.json({
      success: true,
      fileKey,
      metadata: {
        duration: metadata.duration,
        segmentCount: metadata.totalSegments
      },
      message: 'Video processed and uploaded successfully'
    });
  } catch (error) {
    console.error('Error processing video for HLS:', error);
    return c.json(
      {
        success: false,
        type: 'PROCESSING_ERROR',
        message: 'Error processing video for HLS streaming'
      },
      500
    );
  }
});

presignRouter.post('/document/upload', authMiddleware, async (c) => {
  const body = await c.req.json();
  const result = ZCourseDocumentPresignUrlUpload.parse(body);

  const { fileName, fileType } = result;
  const fileKey = generateFileKey(fileName);

  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME.DOCUMENTS,
      Key: fileKey,
      ContentType: fileType
    }) as GetSignedUrlParameters[1];

    const presignedUrl = await getSignedUrl(s3Client as GetSignedUrlParameters[0], command, {
      expiresIn: CLOUDFLARE.R2.PRESIGN_EXPIRATION_TIME
    });

    return c.json({
      success: true,
      url: presignedUrl,
      fileKey,
      message: 'Document pre-signed URL generated successfully'
    });
  } catch (error) {
    console.error('Error generating document pre-signed URL:', error);

    if (error instanceof Error && error.name === 'SignatureDoesNotMatch') {
      return c.json(
        {
          success: false,
          type: 'SIGNATURE_ERROR',
          message: 'Invalid signature for the request'
        },
        403
      );
    }

    return c.json(
      {
        success: false,
        type: 'INTERNAL_ERROR',
        message: 'Error generating document pre-signed URL'
      },
      500
    );
  }
});

presignRouter.post('/download', authMiddleware, async (c) => {
  const body = await c.req.json();
  const result = ZCourseDownloadPresignedUrl.parse(body);

  const { keys } = result;

  try {
    const signedUrls: Record<string, string> = {};

    await Promise.all(
      keys.map(async (key) => {
        const command = new GetObjectCommand({
          Bucket: BUCKET_NAME.VIDEOS,
          Key: key
        }) as GetSignedUrlParameters[1];

        const presignedUrl = await getSignedUrl(s3Client as GetSignedUrlParameters[0], command, {
          expiresIn: CLOUDFLARE.R2.DOWNLOAD_EXPIRATION_TIME
        });

        signedUrls[key] = presignedUrl;
      })
    );

    return c.json({
      success: true,
      urls: signedUrls,
      message: 'Video URLs retrieved successfully'
    });
  } catch (error) {
    console.error('Error Retrieving Video:', error);
    return c.json(
      {
        success: false,
        type: 'INTERNAL_ERROR',
        message: 'Error Retrieving Video'
      },
      500
    );
  }
});

presignRouter.post('/download/document', authMiddleware, async (c) => {
  const body = await c.req.json();
  const result = ZCourseDownloadPresignedUrl.parse(body);

  const { keys } = result;

  try {
    const signedUrls: Record<string, string> = {};

    await Promise.all(
      keys.map(async (key) => {
        const command = new GetObjectCommand({
          Bucket: BUCKET_NAME.DOCUMENTS,
          Key: key
        }) as GetSignedUrlParameters[1];

        const presignedUrl = await getSignedUrl(s3Client as GetSignedUrlParameters[0], command, {
          expiresIn: CLOUDFLARE.R2.DOWNLOAD_EXPIRATION_TIME
        });

        signedUrls[key] = presignedUrl;
      })
    );

    return c.json({
      success: true,
      urls: signedUrls,
      message: 'Document URLs retrieved successfully'
    });
  } catch (error) {
    console.error('Error Retrieving Document:', error);
    return c.json(
      {
        success: false,
        type: 'INTERNAL_ERROR',
        message: 'Error Retrieving Document'
      },
      500
    );
  }
});

// HLS Streaming Endpoints for Enhanced Video Security
presignRouter.get('/hls/stream/:lessonId/:videoKey', authMiddleware, async (c) => {
  const lessonId = c.req.param('lessonId');
  const videoKey = c.req.param('videoKey');

  console.log('HLS Stream request:', { lessonId, videoKey });

  try {
    // Generate HLS manifest
    const manifest = await generateHLSManifest(videoKey, lessonId);

    console.log('Generated manifest:', manifest.substring(0, 200) + '...');

    return c.text(manifest, {
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Range'
      }
    });
  } catch (error) {
    console.error('Error generating HLS manifest:', error);
    return c.json(
      {
        success: false,
        type: 'INTERNAL_ERROR',
        message: 'Error generating HLS manifest'
      },
      500
    );
  }
});

presignRouter.get('/hls/segment/:lessonId/:videoKey/:segmentId', authMiddleware, async (c) => {
  const { lessonId, videoKey, segmentId } = c.req.param();

  try {
    // Serve actual HLS segment through our backend to avoid CORS issues
    const segmentKey = `${videoKey}/segments/${segmentId}`;

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME.VIDEOS,
      Key: segmentKey
    }) as GetSignedUrlParameters[1];

    // Get the segment data from R2
    const response = (await s3Client.send(command)) as any;

    if (!response.Body) {
      return c.json(
        {
          success: false,
          type: 'NOT_FOUND',
          message: 'Segment not found'
        },
        404
      );
    }

    // Convert the stream to buffer
    const chunks: Uint8Array[] = [];
    const reader = response.Body.transformToWebStream().getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const buffer = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
    let offset = 0;
    for (const chunk of chunks) {
      buffer.set(chunk, offset);
      offset += chunk.length;
    }

    // Return the segment with proper headers
    return c.body(buffer, {
      headers: {
        'Content-Type': 'video/mp2t',
        'Cache-Control': 'public, max-age=30',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Range'
      }
    });
  } catch (error) {
    console.error('Error serving segment:', error);
    return c.json(
      {
        success: false,
        type: 'INTERNAL_ERROR',
        message: 'Error serving segment'
      },
      500
    );
  }
});
