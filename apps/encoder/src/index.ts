import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { EncoderApi } from './api';
import { readConfig } from './config';
import { encodeTimeoutMs, probeSource, runFfmpeg } from './ffmpeg';
import { buildFfmpegArgs, buildMasterPlaylist, selectRungs } from './plan';
import { downloadSource, listOutputs, uploadOutputs } from './storage';

/**
 * One encode, then exit.
 *
 * A machine per job rather than a pooled worker: an encode is a discrete unit
 * that can run for hours, so a crash takes only its own machine down and a
 * finished job stops costing money immediately. The queue owns retries, because
 * it knows how many attempts remain.
 */
async function main(): Promise<void> {
  const config = readConfig();
  const api = new EncoderApi(config);
  const workDir = path.join(tmpdir(), `cio-encode-${config.assetId}`);

  try {
    await mkdir(workDir, { recursive: true });
    const sourcePath = path.join(workDir, 'source.bin');

    await api.reportProgress('downloading', 2);
    await downloadSource(config.sourceUrl, sourcePath);

    await api.reportProgress('probing', 8);
    const source = await probeSource(sourcePath);

    const rungs = selectRungs(source);
    if (rungs.length === 0) {
      // Below 360p there is nothing to ladder; the raw upload already plays.
      throw new Error(`Source is ${source.width}x${source.height}, too small for any rung`);
    }

    const outputDir = path.join(workDir, 'out');
    for (const rung of rungs) {
      await mkdir(path.join(outputDir, rung.name), { recursive: true });
    }
    if (source.hasAudio) {
      await mkdir(path.join(outputDir, 'audio'), { recursive: true });
    }

    await api.reportProgress('encoding', 10);
    await runFfmpeg(buildFfmpegArgs({ inputPath: sourcePath, outputDir, rungs, source }), {
      timeoutMs: encodeTimeoutMs(source.durationSeconds),
      onProgress: (outSeconds) => {
        const ratio = source.durationSeconds > 0 ? Math.min(1, outSeconds / source.durationSeconds) : 0;
        void api.reportProgress('encoding', Math.round(10 + ratio * 70));
      }
    });

    // Written here rather than by ffmpeg, so BANDWIDTH and CODECS are correct
    // and there is no audio-only variant to strip afterwards.
    await writeFile(path.join(outputDir, 'master.m3u8'), buildMasterPlaylist({ rungs, source }), 'utf8');

    await api.reportProgress('uploading', 82);
    const outputs = await listOutputs(outputDir);
    const urls = await api.presignOutputs(outputs);
    await uploadOutputs({ outputDir, urls, paths: outputs });

    await api.reportProgress('finalizing', 96);
    await api.finalize({
      manifestPath: 'master.m3u8',
      audioPath: source.hasAudio ? 'audio/playlist.m3u8' : null,
      renditions: rungs.map((rung) => rung.name),
      sourceWidth: source.width,
      sourceHeight: source.height,
      durationSeconds: Math.round(source.durationSeconds)
    });

    console.info('encode complete', { assetId: config.assetId, rungs: rungs.map((rung) => rung.name) });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error('encode failed', { assetId: config.assetId, reason });

    // Report before exiting, so the asset lands on `failed` rather than sitting
    // in `converting` until the stale-claim window expires.
    await api.fail(reason);
    process.exitCode = 1;
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

await main();
