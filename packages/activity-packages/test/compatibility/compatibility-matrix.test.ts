import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { PackageError } from '../../src/errors.js';
import {
  applyLmsRules,
  isScormRuleMet,
  mergeCmi,
  moduleOutcomeFromCmi,
  normalizeCommitCmi,
  statusAfterTerminate
} from '../../src/scorm/runtime/index.js';
import { parseScormManifest, scormLaunchUrl } from '../../src/scorm/manifest/index.js';
import { checkZipEntries, SCORM_ZIP_LIMITS, zipByteLimit } from '../../src/zip/index.js';
import { mintContentToken, verifyContentToken } from '../../src/token/index.js';

const fixturesDir = fileURLToPath(new URL('../fixtures/', import.meta.url));
const sourcesDir = join(fixturesDir, 'sources');
const vendorDir = join(fixturesDir, 'vendor');

function readSource(name: string): string {
  return readFileSync(join(sourcesDir, name, 'imsmanifest.xml'), 'utf8');
}

function hasUnzip(): boolean {
  try {
    execFileSync('unzip', ['-v'], { stdio: 'pipe' });

    return true;
  } catch {
    return false;
  }
}

function zipEntries(zipPath: string): string[] {
  const output = execFileSync('unzip', ['-Z1', zipPath], { encoding: 'utf8' });

  return output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function zipManifest(zipPath: string): string {
  return execFileSync('unzip', ['-p', zipPath, 'imsmanifest.xml'], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
}

function hasZipMagic(zipPath: string): boolean {
  const header = readFileSync(zipPath).subarray(0, 4);

  return (
    (header[0] === 0x50 && header[1] === 0x4b && header[2] === 0x03 && header[3] === 0x04) ||
    (header[0] === 0x50 && header[1] === 0x4b && header[2] === 0x05 && header[3] === 0x06) ||
    (header[0] === 0x50 && header[1] === 0x4b && header[2] === 0x07 && header[3] === 0x08)
  );
}

describe('compatibility matrix: hand-written fixtures', () => {
  it('parses the 1.2 minimal package with one ungraded module', () => {
    const parsed = parseScormManifest(readSource('scorm12-minimal'), ['sco.html']);

    expect(parsed.format).toBe('scorm12');
    expect(parsed.units).toHaveLength(1);
    expect(parsed.units[0]).toMatchObject({ unitType: 'sco', masteryScoreRaw: null });
    expect(parsed.warnings).toEqual([]);
  });

  it('parses the 2004 minimal package with one ungraded module', () => {
    const parsed = parseScormManifest(readSource('scorm2004-minimal'), ['sco.html']);

    expect(parsed.format).toBe('scorm2004_4');
    expect(parsed.units).toHaveLength(1);
    expect(parsed.units[0].passingScoreScaled).toBeNull();
  });

  it('parses three 2004 modules with the quiz graded at 0.8', () => {
    const parsed = parseScormManifest(readSource('scorm2004-three-modules'), [
      'module1.html',
      'module2.html',
      'module3-quiz.html'
    ]);

    expect(parsed.units).toHaveLength(3);
    expect(parsed.units.map((unit) => unit.position)).toEqual([0, 1, 2]);
    expect(parsed.units[2].passingScoreScaled).toBe(0.8);
    expect(parsed.units[0].passingScoreScaled).toBeNull();
    expect(parsed.warnings).not.toContain('has_sequencing');
  });

  it('reads the 1.2 mastery score that settles the automatic rule', () => {
    const parsed = parseScormManifest(readSource('scorm12-quiz-mastery'), ['quiz.html']);

    expect(parsed.format).toBe('scorm12');
    expect(parsed.units[0].masteryScoreRaw).toBe(80);
  });

  it('exercises every 1.2 exit value through the terminate mapping', () => {
    for (const exit of ['', 'suspend', 'logout']) {
      const suspended = statusAfterTerminate({ core: { lesson_status: 'incomplete', exit } }, 'scorm12');

      expect(suspended).toBe(
        exit === 'suspend' ? 'suspended' : exit === '' || exit === 'logout' ? 'suspended' : 'closed'
      );
    }

    for (const status of ['passed', 'completed', 'failed']) {
      expect(statusAfterTerminate({ core: { lesson_status: status, exit: '' } }, 'scorm12')).toBe('closed');
    }
  });

  it('exercises every 2004 exit value through the terminate mapping', () => {
    for (const exit of ['', 'suspend', 'normal', 'logout', 'time-out']) {
      expect(statusAfterTerminate({ exit }, 'scorm2004_4')).toBe(exit === 'suspend' ? 'suspended' : 'closed');
    }
  });

  it('completes three modules in any order only after the last one', () => {
    const done = {
      completion: 'completed' as const,
      success: 'unknown' as const,
      hasPassMark: false,
      scaledScore: null
    };
    const todo = {
      completion: 'incomplete' as const,
      success: 'unknown' as const,
      hasPassMark: false,
      scaledScore: null
    };

    expect(isScormRuleMet({ rule: 'auto' }, [done, todo, done])).toBe(false);
    expect(isScormRuleMet({ rule: 'auto' }, [done, done, done])).toBe(true);
  });

  it('keeps a graded module among ungraded ones incomplete until it passes', () => {
    const modules = [
      { completion: 'completed' as const, success: 'unknown' as const, hasPassMark: false, scaledScore: null },
      { completion: 'completed' as const, success: 'failed' as const, hasPassMark: true, scaledScore: 0.5 }
    ];

    expect(isScormRuleMet({ rule: 'auto' }, modules)).toBe(false);
    expect(
      isScormRuleMet(
        { rule: 'auto' },
        modules.map((module) => (module.hasPassMark ? { ...module, success: 'passed' as const } : module))
      )
    ).toBe(true);
  });

  it('applies the 1.2 mastery score without a status set by the package', () => {
    const passed = applyLmsRules(
      { core: { score: { raw: 85 } } },
      {
        identifier: 'quiz',
        parentIdentifier: null,
        title: 'Quiz',
        position: 0,
        unitType: 'sco',
        href: 'quiz.html',
        parameters: null,
        masteryScoreRaw: 80,
        passingScoreScaled: null,
        completionThreshold: null,
        launchData: null,
        formatDetails: { format: 'scorm12' },
        isVisible: true
      },
      'scorm12',
      { terminated: false }
    );

    expect(passed).toMatchObject({ core: { lesson_status: 'passed' } });

    const failed = applyLmsRules(
      { core: { score: { raw: 60 } } },
      {
        identifier: 'quiz',
        parentIdentifier: null,
        title: 'Quiz',
        position: 0,
        unitType: 'sco',
        href: 'quiz.html',
        parameters: null,
        masteryScoreRaw: 80,
        passingScoreScaled: null,
        completionThreshold: null,
        launchData: null,
        formatDetails: { format: 'scorm12' },
        isVisible: true
      },
      'scorm12',
      { terminated: false }
    );

    expect(failed).toMatchObject({ core: { lesson_status: 'failed' } });
  });

  it('merges resume state across a reload without losing suspend data', () => {
    const stored = { core: { lesson_status: 'incomplete' }, suspend_data: 'bookmark=page-3' };
    const merged = mergeCmi(stored, { core: { lesson_location: 'page-4' } });

    expect(merged).toEqual({
      core: { lesson_status: 'incomplete', lesson_location: 'page-4' },
      suspend_data: 'bookmark=page-3'
    });
  });

  it('parses the streamed-content launcher that frames a second origin', () => {
    const parsed = parseScormManifest(readSource('streamed-launcher'), ['launcher.html']);

    expect(parsed.format).toBe('scorm2004_4');
    expect(parsed.units).toHaveLength(1);
    expect(parsed.units[0]).toMatchObject({ unitType: 'sco', href: 'launcher.html' });

    const launcher = readFileSync(join(sourcesDir, 'streamed-launcher', 'launcher.html'), 'utf8');

    expect(launcher).toContain('API_1484_11');
    expect(launcher).toContain('postMessage');
    expect(launcher).toContain('<iframe');
    expect(launcher).toContain('127.0.0.1:3003');
  });

  it('parses the Storyline-shaped 1.2 package through its index_lms entry point', () => {
    const parsed = parseScormManifest(readSource('vendor-storyline-style'), ['index_lms.html', 'media/intro.mp4']);

    expect(parsed.format).toBe('scorm12');
    expect(parsed.units).toHaveLength(1);
    expect(parsed.units[0]).toMatchObject({ unitType: 'sco', href: 'index_lms.html', masteryScoreRaw: 80 });
  });

  it('parses the Rise-shaped 2004 package through its indexapi entry point', () => {
    const names = [
      'indexapi.html',
      'assets/app-01.js',
      'assets/theme-01.css',
      'assets/content-01.json',
      'assets/font-01.woff2',
      'assets/image-01.png',
      'assets/captions-01.vtt',
      'assets/clip-01.mp4'
    ];
    const parsed = parseScormManifest(readSource('vendor-rise-style'), names);

    expect(parsed.format).toBe('scorm2004_4');
    expect(parsed.units).toHaveLength(1);
    expect(parsed.units[0]).toMatchObject({ unitType: 'sco', href: 'indexapi.html' });
    expect(parsed.warnings).not.toContain('has_sequencing');
  });

  it('rejects an absolute launch URL and an assets-only manifest', () => {
    try {
      parseScormManifest(readSource('reject-external-launch'), ['sco.html']);
      expect.unreachable();
    } catch (error) {
      expect((error as PackageError).code).toBe('external_launch');
    }

    try {
      parseScormManifest(readSource('reject-assets-only'), ['handout.html']);
      expect.unreachable();
    } catch (error) {
      expect((error as PackageError).code).toBe('assets_only');
    }
  });

  it('accepts the scorm-again wire shape used by every fixture button', () => {
    expect(normalizeCommitCmi({ commitSequence: 1, cmi: { core: { lesson_status: 'completed' } } }).seq).toBe(1);
    expect(normalizeCommitCmi({ seq: 2, cmi: {}, terminate: true }).terminate).toBe(true);
  });
});

describe('compatibility matrix: Rustici golf examples', () => {
  const golfZips = readdirSync(fixturesDir).filter(
    (name) =>
      name.endsWith('.zip') &&
      !name.startsWith('scorm') &&
      !name.startsWith('reject') &&
      !name.startsWith('streamed') &&
      !name.startsWith('vendor-')
  );

  it('ships the multi-edition golf set committed for CI', () => {
    expect(golfZips.length).toBeGreaterThanOrEqual(15);
    for (const name of golfZips) {
      expect(hasZipMagic(join(fixturesDir, name))).toBe(true);
      expect(statSync(join(fixturesDir, name)).size).toBeGreaterThan(0);
    }
  });

  it.each([
    ['RuntimeMinimumCalls_SCORM12.zip', 18],
    ['RuntimeMinimumCalls_SCORM20043rdEdition.zip', 18]
  ])('parses %s with %i launchable modules', (zipName, expectedScoCount) => {
    if (!hasUnzip()) return;

    const zipPath = join(fixturesDir, zipName);
    const names = zipEntries(zipPath);
    const manifest = zipManifest(zipPath);
    const lookup = (() => {
      const found = names.includes('imsmanifest.xml')
        ? { prefix: '' }
        : (() => {
            const nested = names.filter((name) => /^[^/]+\/imsmanifest\.xml$/.test(name));
            const folders = new Set(nested.map((name) => name.slice(0, name.indexOf('/'))));
            if (folders.size === 1) {
              const folder = [...folders][0];
              return { prefix: `${folder}/` };
            }
            return { prefix: '' };
          })();

      return found;
    })();
    const relative = names.map((name) =>
      lookup.prefix && name.startsWith(lookup.prefix) ? name.slice(lookup.prefix.length) : name
    );
    const parsed = parseScormManifest(manifest, relative, lookup.prefix);
    const scoCount = parsed.units.filter((unit) => unit.unitType === 'sco').length;

    expect(scoCount).toBe(expectedScoCount);

    const quiz = parsed.units.find((unit) => unit.identifier === 'playing_quiz_item');

    expect(quiz?.parameters).toBe('?questions=Playing');
    expect(scormLaunchUrl(quiz!.href, quiz!.parameters)).toBe('shared/assessmenttemplate.html?questions=Playing');
  });

  it('flags sequencing samples while keeping them launchable', () => {
    if (!hasUnzip()) return;

    const sequencing = golfZips.filter((name) => name.startsWith('Sequencing'));
    expect(sequencing.length).toBeGreaterThanOrEqual(5);

    for (const zipName of sequencing) {
      const zipPath = join(fixturesDir, zipName);
      const names = zipEntries(zipPath);
      const manifest = zipManifest(zipPath);
      const parsed = parseScormManifest(manifest, names, '');

      expect(parsed.units.filter((unit) => unit.unitType === 'sco').length).toBeGreaterThanOrEqual(1);
      expect(parsed.warnings).toContain('has_sequencing');
    }
  });

  it('rejects asset-only golf packs with the nothing-to-track error', () => {
    if (!hasUnzip()) return;

    for (const zipName of [
      'ContentPackagingOneFilePerSCO_SCORM12.zip',
      'ContentPackagingOneFilePerSCO_SCORM20043rdEdition.zip'
    ]) {
      const zipPath = join(fixturesDir, zipName);
      const names = zipEntries(zipPath);
      const manifest = zipManifest(zipPath);

      try {
        parseScormManifest(manifest, names, '');
        expect.unreachable();
      } catch (error) {
        expect((error as PackageError).code).toBe('assets_only');
      }
    }
  });

  it('derives module outcomes with the same mapping used at commit time', () => {
    const scored = moduleOutcomeFromCmi(
      { completion_status: 'completed', success_status: 'passed', score: { scaled: '0.9' } },
      'scorm2004_4',
      {
        masteryScoreRaw: null,
        passingScoreScaled: 0.8,
        completionThreshold: null
      }
    );

    expect(scored).toMatchObject({ completion: 'completed', success: 'passed', hasPassMark: true });
  });
});

describe('compatibility matrix: tokens across tenant and custom hosts', () => {
  const secret = 'compatibility-matrix-secret-'.repeat(2);
  const now = Date.UTC(2026, 9, 9, 12, 0, 0);

  it('mints one weekly content token reused on subdomains and custom domains', async () => {
    const prefix = 'scorm/asset-1/v1';
    const tenantAnc = ['https://acme.myclassroomio.com'];
    const customAnc = ['https://learn.acme.com'];
    const first = await mintContentToken({ org: 'acme', prefix, anc: tenantAnc }, secret, now);
    const second = await mintContentToken({ org: 'acme', prefix, anc: tenantAnc }, secret, now + 3600_000);

    expect(first).toBe(second);
    expect((await verifyContentToken(first, secret, { org: 'acme', prefix }, now)).anc).toEqual(tenantAnc);
    expect(
      (await verifyContentToken(first, secret, { org: 'acme', prefix }, now + 7 * 24 * 3600_000)).wk
    ).toBeDefined();

    const custom = await mintContentToken({ org: 'acme', prefix, anc: customAnc }, secret, now);

    expect(custom).not.toBe(first);
    expect((await verifyContentToken(custom, secret, { org: 'acme', prefix }, now)).anc).toEqual(customAnc);
  });

  it('enforces the 500 MB default through the shared zip limits', () => {
    expect(zipByteLimit(500)).toBe(500 * 1024 * 1024);
    expect(SCORM_ZIP_LIMITS.maxEntries).toBe(10000);
    expect(SCORM_ZIP_LIMITS.maxRatio).toBe(100);
    expect(() =>
      checkZipEntries(
        [
          {
            name: 'big.mp4',
            size: zipByteLimit(500) * 3 + 1,
            compressedSize: zipByteLimit(500) * 3 + 1,
            isDirectory: false
          }
        ],
        {
          maxEntries: SCORM_ZIP_LIMITS.maxEntries,
          maxTotalBytes: zipByteLimit(500) * 3,
          maxRatio: SCORM_ZIP_LIMITS.maxRatio
        }
      )
    ).toThrowError(PackageError);
  });
});

describe('compatibility matrix: local-only vendor rows', () => {
  it('documents Adapt and vendor exports as manual rows when absent', () => {
    expect(existsSync(join(fixturesDir, 'ATTRIBUTION.md'))).toBe(true);
    expect(existsSync(join(vendorDir, 'README.md'))).toBe(true);

    const local = existsSync(vendorDir) ? readdirSync(vendorDir).filter((name) => name.endsWith('.zip')) : [];

    expect(Array.isArray(local)).toBe(true);
  });
});
