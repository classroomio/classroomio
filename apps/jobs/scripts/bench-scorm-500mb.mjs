import { execFileSync } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { mkdir, mkdtemp, rm, stat, truncate, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';

const BENCH_MB = Number(process.env.BENCH_MB ?? 500);
const OVERHEAD_HEADROOM_BYTES = 64 * 1024;
const TARGET_PAYLOAD_BYTES = BENCH_MB * 1024 * 1024 - OVERHEAD_HEADROOM_BYTES;
const HEAP_GROWTH_LIMIT_BYTES = 100 * 1024 * 1024;

function heapMb() {
  return Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
}

async function buildSparsePackage(stagingDir) {
  const payloadPath = join(stagingDir, 'media', 'lecture.mp4');

  await writeFile(payloadPath, '');
  await truncate(payloadPath, TARGET_PAYLOAD_BYTES);
  await writeFile(
    join(stagingDir, 'imsmanifest.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="BENCH" version="1" xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2" xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2">
  <metadata><schema>ADL SCORM</schema><schemaversion>1.2</schemaversion></metadata>
  <organizations default="ORG-1"><organization identifier="ORG-1"><title>Bench</title>
    <item identifier="ITEM-1" identifierref="RES-1"><title>Bench SCO</title></item>
  </organization></organizations>
  <resources><resource identifier="RES-1" type="webcontent" adlcp:scormtype="sco" href="sco.html">
    <file href="sco.html"/><file href="media/lecture.mp4"/>
  </resource></resources>
</manifest>`
  );
  await writeFile(join(stagingDir, 'sco.html'), '<!doctype html><html><body>bench</body></html>');

  const zipPath = join(tmpdir(), `scorm-bench-${Date.now()}.zip`);

  execFileSync('zip', ['-0', '-qr', zipPath, '.'], { cwd: stagingDir });

  return zipPath;
}

async function streamEntries(zipPath, yauzl) {
  const zipfile = await yauzl.openPromise(zipPath, { validateEntrySizes: true, autoClose: false });
  const entries = [];

  try {
    for await (const entry of zipfile.eachEntry()) {
      entries.push({
        name: entry.fileName,
        size: entry.uncompressedSize,
        compressedSize: entry.compressedSize,
        isDirectory: entry.fileName.endsWith('/')
      });
    }
  } finally {
    if (zipfile.isOpen) zipfile.close();
  }

  return entries;
}

async function streamExtract(zipPath, yauzl, outDir) {
  const zipfile = await yauzl.openPromise(zipPath, { autoClose: false });
  let extractedBytes = 0;

  try {
    for await (const entry of zipfile.eachEntry()) {
      if (entry.fileName.endsWith('/')) continue;

      const localPath = join(outDir, entry.fileName.replace(/\\/g, '/'));
      await mkdir(join(localPath, '..'), { recursive: true });
      const stream = await zipfile.openReadStreamPromise(entry);

      await pipeline(stream, createWriteStream(localPath));
      extractedBytes += entry.uncompressedSize;
    }
  } finally {
    if (zipfile.isOpen) zipfile.close();
  }

  return extractedBytes;
}

async function main() {
  if (!Number.isFinite(BENCH_MB) || BENCH_MB <= 0) throw new Error('BENCH_MB must be a positive number');

  const { default: yauzl } = await import('yauzl');
  const { SCORM_ZIP_LIMITS, checkZipEntries, zipByteLimit } = await import('@cio/activity-packages');

  const stagingDir = await mkdtemp(join(tmpdir(), 'scorm-bench-src-'));
  const extractDir = await mkdtemp(join(tmpdir(), 'scorm-bench-out-'));
  await mkdir(join(stagingDir, 'media'), { recursive: true });

  let zipPath = '';
  const heapBefore = heapMb();

  try {
    zipPath = await buildSparsePackage(stagingDir);
    const zipBytes = (await stat(zipPath)).size;
    const heapAfterBuild = heapMb();

    if (zipBytes > zipByteLimit(500)) throw new Error(`bench zip exceeds the 500 MB limit: ${zipBytes}`);

    const entries = await streamEntries(zipPath, yauzl);
    const heapAfterList = heapMb();

    checkZipEntries(entries, {
      maxEntries: SCORM_ZIP_LIMITS.maxEntries,
      maxTotalBytes: zipByteLimit(500) * 3,
      maxRatio: SCORM_ZIP_LIMITS.maxRatio
    });

    const extractedBytes = await streamExtract(zipPath, yauzl, extractDir);
    const heapAfterExtract = heapMb();
    const listGrowth = (heapAfterList - heapBefore) * 1024 * 1024;

    console.log(
      JSON.stringify(
        {
          zipBytes,
          extractedBytes,
          heapBeforeMb: heapBefore,
          heapAfterBuildMb: heapAfterBuild,
          heapAfterListMb: heapAfterList,
          heapAfterExtractMb: heapAfterExtract
        },
        null,
        2
      )
    );

    if (listGrowth > HEAP_GROWTH_LIMIT_BYTES)
      throw new Error(`heap grew ${(listGrowth / 1024 / 1024).toFixed(1)} MB while listing`);
    if (extractedBytes < TARGET_PAYLOAD_BYTES) throw new Error('extracted fewer bytes than the payload holds');

    console.log('bench passed: streaming extraction held memory flat');
  } finally {
    await rm(stagingDir, { recursive: true, force: true });
    await rm(extractDir, { recursive: true, force: true });
    if (zipPath) await rm(zipPath, { force: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
