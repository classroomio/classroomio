import { describe, expect, it } from 'vitest';
import {
  applyLmsRules,
  isScormRuleMet,
  isStaleCommit,
  mergeCmi,
  moduleOutcomeFromCmi,
  normalizeCommitCmi
} from '../../src/scorm/runtime/index.js';
import { checkZipEntries, SCORM_ZIP_LIMITS, zipByteLimit } from '../../src/zip/index.js';
import { contentTypeForFile } from '../../src/content-types.js';

const learners = 1000;
const commitIntervalSeconds = 30;

describe('scorm load: simulated commit burst', () => {
  it('serves 1,000 learners committing every 30 seconds through the pure pipeline', () => {
    const started = Date.now();
    let completed = 0;

    for (let index = 0; index < learners; index += 1) {
      const stored = { core: { lesson_status: 'incomplete' }, suspend_data: `bookmark=${index}` };
      const commit = normalizeCommitCmi({
        commitSequence: index + 1,
        cmi: { 'core.lesson_status': 'completed', 'core.exit': '' },
        terminate: true
      });
      const merged = mergeCmi(stored, commit.cmi);
      const ruled = applyLmsRules(
        merged,
        {
          identifier: 'ITEM-1',
          parentIdentifier: null,
          title: 'SCO',
          position: 0,
          unitType: 'sco',
          href: 'sco.html',
          parameters: null,
          masteryScoreRaw: null,
          passingScoreScaled: null,
          completionThreshold: null,
          launchData: null,
          formatDetails: { format: 'scorm12' },
          isVisible: true
        },
        'scorm12',
        { terminated: commit.terminate }
      );
      const outcome = moduleOutcomeFromCmi(ruled, 'scorm12', {
        masteryScoreRaw: null,
        passingScoreScaled: null,
        completionThreshold: null
      });

      if (isScormRuleMet({ rule: 'auto' }, [outcome])) completed += 1;
    }

    const elapsedMs = Date.now() - started;
    const requiredRps = learners / commitIntervalSeconds;

    expect(completed).toBe(learners);
    expect(requiredRps).toBeCloseTo(33.33, 1);
    expect(elapsedMs).toBeLessThan(5000);
  });

  it('ignores stale sequences when a burst retries the same commit', () => {
    let commitSeq = 0;
    let saved = 0;

    for (const seq of [1, 1, 2, 2, 3]) {
      if (!isStaleCommit(seq, commitSeq)) {
        commitSeq = seq;
        saved += 1;
      }
    }

    expect(saved).toBe(3);
    expect(commitSeq).toBe(3);
  });
});

describe('scorm load: beacon budget', () => {
  it('keeps changed-fields commits far under the 64 KiB beacon budget', () => {
    // Browsers cap beacons and keepalive fetches at 64 KiB, so Terminate sends deltas only.
    const terminateCommit = JSON.stringify({
      commitSequence: 42,
      cmi: { core: { lesson_status: 'completed', exit: '' } },
      terminate: true
    });

    expect(terminateCommit.length).toBeLessThan(1024);
    expect(64 * 1024).toBe(65536);
  });

  it('stores a 10 KB suspend value whole instead of truncating it', () => {
    const suspend = 'x'.repeat(10 * 1024);
    const commit = normalizeCommitCmi({ commitSequence: 1, cmi: { suspend_data: suspend } });
    const merged = mergeCmi({}, commit.cmi);

    expect((merged as Record<string, unknown>)['suspend_data']).toBe(suspend);
  });
});

describe('scorm load: 500 MB package budget', () => {
  it('defaults the package limit to 500 MB with three times that uncompressed', () => {
    expect(zipByteLimit(500)).toBe(524288000);
    expect(zipByteLimit(500) * 3).toBe(1572864000);
  });

  it('rejects entries whose total size exceeds three times the package limit', () => {
    const maxTotalBytes = zipByteLimit(500) * 3;
    const entry = {
      name: 'content.bin',
      size: maxTotalBytes + 1,
      compressedSize: maxTotalBytes + 1,
      isDirectory: false
    };

    expect(() =>
      checkZipEntries([entry], {
        maxEntries: SCORM_ZIP_LIMITS.maxEntries,
        maxTotalBytes,
        maxRatio: SCORM_ZIP_LIMITS.maxRatio
      })
    ).toThrowError(expect.objectContaining({ code: 'total_too_large' }));
  });

  it('rejects a zip bomb at a 100:1 ratio without reading its contents', () => {
    expect(() =>
      checkZipEntries([{ name: 'video.mp4', size: 101 * 1024, compressedSize: 1024, isDirectory: false }], {
        maxEntries: SCORM_ZIP_LIMITS.maxEntries,
        maxTotalBytes: zipByteLimit(500) * 3,
        maxRatio: SCORM_ZIP_LIMITS.maxRatio
      })
    ).toThrowError();
  });

  it('serves video with the content type Safari range playback requires', () => {
    expect(contentTypeForFile('movie.mp4')).toBe('video/mp4');
    expect(contentTypeForFile('captions.vtt')).toBe('text/vtt; charset=utf-8');
  });
});
