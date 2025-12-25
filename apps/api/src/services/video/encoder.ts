import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, readdir, mkdir } from 'fs/promises';
import { writeFile } from 'fs/promises';
import path from 'path';
import type { HLSEncodingResult } from './types';
import { uploadFilesToR2, getR2PublicUrl } from './storage';
import { BUCKET_NAME } from '@api/constants/upload';

const execAsync = promisify(exec);

interface EncodingVariant {
  resolution: string;
  bitrate: string;
  outputName: string;
  profile: string;
  level: string;
}

const ENCODING_VARIANTS: EncodingVariant[] = [
  {
    resolution: '1280x720',
    bitrate: '1200k',
    outputName: '720p',
    profile: 'main',
    level: '3.1',
  },
  {
    resolution: '1920x1080',
    bitrate: '2500k',
    outputName: '1080p',
    profile: 'high',
    level: '4.2',
  },
  {
    resolution: '3840x2160',
    bitrate: '8000k',
    outputName: '2160p',
    profile: 'high',
    level: '5.1',
  },
];

const GOP_SIZE = 48;
const HLS_SEGMENT_TIME = 4;

/**
 * Encode video to HLS format with multiple quality variants
 */
export async function encodeVideoToHLS(
  videoBuffer: Buffer,
  fileKey: string,
  tempDir: string
): Promise<HLSEncodingResult> {
  // Save video to temp file
  const inputVideoPath = path.join(tempDir, 'input.mp4');
  await writeFile(inputVideoPath, videoBuffer);

  // Create output directory for HLS files
  const outputDir = path.join(tempDir, 'hls');
  await mkdir(outputDir, { recursive: true });

  const playlists: string[] = [];
  const allSegments: string[] = [];

  // Encode each quality variant
  for (const variant of ENCODING_VARIANTS) {
    const playlistName = `${variant.outputName}.m3u8`;
    const segmentPattern = path.join(outputDir, `${variant.outputName}_%03d.ts`);

    await execAsync(
      `ffmpeg -y -i "${inputVideoPath}" ` +
        `-c:v libx264 -preset veryfast -profile:v ${variant.profile} -level:v ${variant.level} ` +
        `-b:v ${variant.bitrate} -s ${variant.resolution} ` +
        `-c:a aac -b:a 128k -ac 2 ` +
        `-g ${GOP_SIZE} -keyint_min ${GOP_SIZE} -sc_threshold 0 ` +
        `-force_key_frames "expr:gte(t,n_forced*${HLS_SEGMENT_TIME})" ` +
        `-hls_time ${HLS_SEGMENT_TIME} -hls_list_size 0 -hls_flags independent_segments ` +
        `-hls_segment_filename "${segmentPattern}" ` +
        `"${path.join(outputDir, playlistName)}"`
    );

    playlists.push(playlistName);

    // Get all segments for this variant
    const files = await readdir(outputDir);
    const segments = files.filter((f) => f.startsWith(`${variant.outputName}_`) && f.endsWith('.ts'));
    allSegments.push(...segments.map((s) => `${variant.outputName}/${s}`));
  }

  // Create master playlist
  const masterPlaylist = generateMasterPlaylist(ENCODING_VARIANTS);
  const masterPlaylistPath = path.join(outputDir, 'master.m3u8');
  await writeFile(masterPlaylistPath, masterPlaylist);

  // Upload all files to R2
  const filesToUpload: Array<{ key: string; content: Buffer; contentType: string }> = [];

  // Upload master playlist
  const masterContent = await readFile(masterPlaylistPath);
  filesToUpload.push({
    key: `hls/${fileKey}/master.m3u8`,
    content: masterContent,
    contentType: 'application/vnd.apple.mpegurl',
  });

  // Upload variant playlists
  for (const playlist of playlists) {
    const playlistPath = path.join(outputDir, playlist);
    const content = await readFile(playlistPath);
    filesToUpload.push({
      key: `hls/${fileKey}/${playlist}`,
      content: content,
      contentType: 'application/vnd.apple.mpegurl',
    });
  }

  // Upload segments
  for (const variant of ENCODING_VARIANTS) {
    const files = await readdir(outputDir);
    const segments = files.filter((f) => f.startsWith(`${variant.outputName}_`) && f.endsWith('.ts'));

    for (const segment of segments) {
      const segmentPath = path.join(outputDir, segment);
      const content = await readFile(segmentPath);
      filesToUpload.push({
        key: `hls/${fileKey}/${variant.outputName}/${segment}`,
        content: content,
        contentType: 'video/mp2t',
      });
    }
  }

  await uploadFilesToR2(filesToUpload);

  // Generate manifest URL
  const manifestUrl = getR2PublicUrl(`hls/${fileKey}/master.m3u8`);

  return {
    manifestUrl,
    qualities: ENCODING_VARIANTS.map((v) => v.outputName),
    segments: allSegments,
  };
}

/**
 * Generate HLS master playlist
 */
function generateMasterPlaylist(variants: EncodingVariant[]): string {
  const bandwidths = {
    '720p': 1200000,
    '1080p': 2500000,
    '2160p': 8000000,
  };

  const resolutions = {
    '720p': '1280x720',
    '1080p': '1920x1080',
    '2160p': '3840x2160',
  };

  let playlist = '#EXTM3U\n#EXT-X-VERSION:3\n\n';

  for (const variant of variants) {
    const bandwidth = bandwidths[variant.outputName as keyof typeof bandwidths];
    const resolution = resolutions[variant.outputName as keyof typeof resolutions];
    playlist += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${resolution}\n`;
    playlist += `${variant.outputName}.m3u8\n\n`;
  }

  return playlist;
}
