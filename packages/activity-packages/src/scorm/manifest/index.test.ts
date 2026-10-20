import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PackageError } from '../../errors.js';
import { parseScormManifest, scormLaunchUrl } from './index.js';

const sourcesDir = new URL('../../../test/fixtures/sources/', import.meta.url);

function readSource(name: string): string {
  return readFileSync(new URL(`${name}/imsmanifest.xml`, sourcesDir), 'utf8');
}

function manifestWith(versionLine: string, body = ''): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="T" version="1"
  xmlns="http://www.imsglobal.org/xsd/imscp_v1p1"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_v1p3">
  <metadata><schema>ADL SCORM</schema>${versionLine}</metadata>
  <organizations default="ORG-1"><organization identifier="ORG-1"><title>Versioned</title>
    <item identifier="ITEM-1" identifierref="RES-1"><title>SCO</title>${body}</item>
  </organization></organizations>
  <resources><resource identifier="RES-1" type="webcontent" adlcp:scormType="sco" href="sco.html">
    <file href="sco.html"/>
  </resource></resources>
</manifest>`;
}

describe('parseScormManifest fixtures', () => {
  it('parses the minimal 1.2 package', () => {
    const parsed = parseScormManifest(readSource('scorm12-minimal'), ['sco.html']);

    expect(parsed.format).toBe('scorm12');
    expect(parsed.manifestIdentifier).toBe('CIO-SCORM12-MINIMAL');
    expect(parsed.units).toHaveLength(1);
    expect(parsed.units[0]).toMatchObject({
      identifier: 'ITEM-1',
      parentIdentifier: null,
      title: 'Minimal SCO',
      position: 0,
      unitType: 'sco',
      href: 'sco.html',
      masteryScoreRaw: null,
      passingScoreScaled: null,
      completionThreshold: null
    });
    expect(parsed.units[0].formatDetails).toEqual({ format: 'scorm12' });
    expect(parsed.warnings).toEqual([]);
  });

  it('parses the minimal 2004 package', () => {
    const parsed = parseScormManifest(readSource('scorm2004-minimal'), ['sco.html']);

    expect(parsed.format).toBe('scorm2004_4');
    expect(parsed.units).toHaveLength(1);
    expect(parsed.units[0].unitType).toBe('sco');
  });

  it('parses three modules with the quiz pass mark', () => {
    const parsed = parseScormManifest(readSource('scorm2004-three-modules'), [
      'module1.html',
      'module2.html',
      'module3-quiz.html'
    ]);

    expect(parsed.units.map((unit) => unit.title)).toEqual(['Welcome', 'Core concepts', 'Final quiz']);
    expect(parsed.units.map((unit) => unit.position)).toEqual([0, 1, 2]);
    expect(parsed.units[2].passingScoreScaled).toBe(0.8);
    expect(parsed.units[2].completionThreshold).toBeNull();
    expect(parsed.units[0].passingScoreScaled).toBeNull();
  });

  it('reads the 1.2 mastery score', () => {
    const parsed = parseScormManifest(readSource('scorm12-quiz-mastery'), ['quiz.html']);

    expect(parsed.format).toBe('scorm12');
    expect(parsed.units[0].masteryScoreRaw).toBe(80);
    expect(parsed.units[0].passingScoreScaled).toBeNull();
    expect(parsed.units[0].completionThreshold).toBeNull();
    expect(parsed.units[0].formatDetails).toEqual({ format: 'scorm12' });
  });

  it('parses a SCO with outbound references without warnings', () => {
    const parsed = parseScormManifest(readSource('scorm12-external-refs'), ['sco.html']);

    expect(parsed.format).toBe('scorm12');
    expect(parsed.units).toHaveLength(1);
    expect(parsed.units[0]).toMatchObject({ identifier: 'ITEM-1', unitType: 'sco', href: 'sco.html' });
    expect(parsed.warnings).toEqual([]);
  });

  it('rejects external launches and asset-only manifests', () => {
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
});

describe('parseScormManifest versions', () => {
  it('detects every edition from schemaversion', () => {
    const cases: Array<[string, string]> = [
      ['<schemaversion>1.2</schemaversion>', 'scorm12'],
      ['<schemaversion>SCORM 1.2</schemaversion>', 'scorm12'],
      ['<schemaversion>CAM 1.3</schemaversion>', 'scorm2004_2'],
      ['<schemaversion>2004 2nd Edition</schemaversion>', 'scorm2004_2'],
      ['<schemaversion>2004 3rd Edition</schemaversion>', 'scorm2004_3'],
      ['<schemaversion>2004 4th Edition</schemaversion>', 'scorm2004_4']
    ];

    for (const [versionLine, format] of cases) {
      expect(parseScormManifest(manifestWith(versionLine), ['sco.html']).format).toBe(format);
    }
  });

  it('falls back to namespaces, then 1.2', () => {
    expect(parseScormManifest(manifestWith(''), ['sco.html']).format).toBe('scorm2004_4');

    const bare12 = `<?xml version="1.0"?>
<manifest identifier="T" xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2" xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2">
  <metadata><schema>ADL SCORM</schema></metadata>
  <organizations default="O"><organization identifier="O"><title>T</title>
    <item identifier="I" identifierref="R"><title>S</title></item>
  </organization></organizations>
  <resources><resource identifier="R" type="webcontent" adlcp:scormtype="sco" href="sco.html"><file href="sco.html"/></resource></resources>
</manifest>`;
    expect(parseScormManifest(bare12, ['sco.html']).format).toBe('scorm12');

    const bareUnknown = bare12
      .replace('http://www.imsproject.org/xsd/imscp_rootv1p1p2', 'http://example.com/ns')
      .replace('http://www.adlnet.org/xsd/adlcp_rootv1p2', 'http://example.com/adlcp');
    expect(parseScormManifest(bareUnknown, ['sco.html']).format).toBe('scorm12');
  });

  it('rejects unknown schemaversions', () => {
    try {
      parseScormManifest(manifestWith('<schemaversion>2.0</schemaversion>'), ['sco.html']);
      expect.unreachable();
    } catch (error) {
      expect((error as PackageError).code).toBe('unsupported_version');
    }
  });
});

describe('parseScormManifest rejections', () => {
  it('rejects DOCTYPE and invalid XML', () => {
    const withDoctype = readSource('scorm12-minimal').replace(
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<?xml version="1.0"?><!DOCTYPE manifest [<!ENTITY x "y">]>'
    );

    try {
      parseScormManifest(withDoctype, ['sco.html']);
      expect.unreachable();
    } catch (error) {
      expect((error as PackageError).code).toBe('doctype_rejected');
    }

    for (const bad of ['<manifest><unclosed>', '<not-a-manifest/>', '']) {
      try {
        parseScormManifest(bad, []);
        expect.unreachable();
      } catch (error) {
        expect((error as PackageError).code).toBe('invalid_xml');
      }
    }
  });

  it('rejects missing launch files', () => {
    try {
      parseScormManifest(readSource('scorm12-minimal'), ['other.html']);
      expect.unreachable();
    } catch (error) {
      expect((error as PackageError).code).toBe('missing_launch');
    }
  });
});

describe('parseScormManifest structure', () => {
  it('rebases a nested root folder', () => {
    const parsed = parseScormManifest(readSource('scorm12-minimal'), ['pkg/sco.html'], 'pkg/');

    expect(parsed.units[0].href).toBe('pkg/sco.html');
    expect(parsed.warnings).toContain('manifest_rebased');
  });

  it('resolves xml:base and absolute URLs', () => {
    const withBase = readSource('scorm12-minimal').replace('href="sco.html"', 'xml:base="content/" href="sco.html"');
    const parsed = parseScormManifest(withBase, ['content/sco.html']);

    expect(parsed.units[0].href).toBe('content/sco.html');

    const absolute = withBase.replace('href="sco.html"', 'href="https://cdn.example.com/sco.html"');

    try {
      parseScormManifest(absolute, ['content/sco.html']);
      expect.unreachable();
    } catch (error) {
      expect((error as PackageError).code).toBe('external_launch');
    }
  });

  it('inherits xml:base from the manifest and resources elements', () => {
    const xml = `<?xml version="1.0"?>
<manifest identifier="M" xml:base="tenant/" xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2" xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2">
  <metadata><schema>ADL SCORM</schema><schemaversion>1.2</schemaversion></metadata>
  <organizations default="ORG-1">
    <organization identifier="ORG-1"><title>Based</title>
      <item identifier="A" identifierref="R"><title>Module A</title></item>
    </organization>
  </organizations>
  <resources xml:base="pkg/"><resource identifier="R" type="webcontent" adlcp:scormType="SCO" href="sco.html"><file href="sco.html"/></resource></resources>
</manifest>`;
    const parsed = parseScormManifest(xml, ['tenant/pkg/sco.html']);

    expect(parsed.units[0].href).toBe('tenant/pkg/sco.html');
  });

  it('fixes launch case with a warning', () => {
    const cased = readSource('scorm12-minimal').replace(/sco\.html/g, 'SCO.HTML');
    const parsed = parseScormManifest(cased, ['sco.html']);

    expect(parsed.units[0].href).toBe('sco.html');
    expect(parsed.warnings).toContain('href_case_fixed');
  });

  it('picks the default organization and skips resourceless items', () => {
    const xml = `<?xml version="1.0"?>
<manifest identifier="M" xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2" xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2">
  <metadata><schema>ADL SCORM</schema><schemaversion>1.2</schemaversion></metadata>
  <organizations default="ORG-2">
    <organization identifier="ORG-1"><title>First</title>
      <item identifier="SKIP" identifierref="MISSING"><title>Dangling</title></item>
    </organization>
    <organization identifier="ORG-2"><title>Second</title>
      <item identifier="CH"><title>Chapter</title>
        <item identifier="LEAF" identifierref="R"><title>Leaf SCO</title></item>
      </item>
    </organization>
  </organizations>
  <resources><resource identifier="R" type="webcontent" adlcp:scormType="SCO" href="sco.html"><file href="sco.html"/></resource></resources>
</manifest>`;
    const parsed = parseScormManifest(xml, ['sco.html']);

    expect(parsed.title).toBe('Second');
    expect(parsed.units).toHaveLength(1);
    expect(parsed.units[0]).toMatchObject({ identifier: 'LEAF', parentIdentifier: 'CH', position: 0 });
  });

  it('reads satisfiedByMeasure, thresholds and sequencing', () => {
    const noSatisfy = manifestWith(
      '<schemaversion>2004 4th Edition</schemaversion>',
      '<imsss:objectives xmlns:imsss="http://www.imsglobal.org/xsd/imsss"><imsss:primaryObjective satisfiedByMeasure="false"><imsss:minNormalizedMeasure>0.8</imsss:minNormalizedMeasure></imsss:primaryObjective></imsss:objectives>'
    );
    expect(parseScormManifest(noSatisfy, ['sco.html']).units[0].passingScoreScaled).toBeNull();

    const withRest = manifestWith(
      '<schemaversion>2004 4th Edition</schemaversion>',
      '<adlcp:completionThreshold>0.6</adlcp:completionThreshold><imsss:maxTimeAllowed xmlns:imsss="http://www.imsglobal.org/xsd/imsss">PT45M</imsss:maxTimeAllowed><imsss:sequencing xmlns:imsss="http://www.imsglobal.org/xsd/imsss"><imsss:controlMode choice="false"/></imsss:sequencing>'
    );
    const parsed = parseScormManifest(withRest, ['sco.html']);

    expect(parsed.units[0].completionThreshold).toBe(0.6);
    expect(parsed.units[0].formatDetails).toEqual({
      format: 'scorm2004',
      maxTimeAllowed: 'PT45M',
      timeLimitAction: null
    });
    expect(parsed.warnings).toContain('has_sequencing');
  });

  it('treats out-of-range pass marks as absent', () => {
    const outOfRange = manifestWith(
      '<schemaversion>2004 4th Edition</schemaversion>',
      '<imsss:objectives xmlns:imsss="http://www.imsglobal.org/xsd/imsss"><imsss:primaryObjective satisfiedByMeasure="true"><imsss:minNormalizedMeasure>2.5</imsss:minNormalizedMeasure></imsss:primaryObjective></imsss:objectives><adlcp:completionThreshold>1.5</adlcp:completionThreshold>'
    );
    const parsed2004 = parseScormManifest(outOfRange, ['sco.html']);

    expect(parsed2004.units[0].passingScoreScaled).toBeNull();
    expect(parsed2004.units[0].completionThreshold).toBeNull();

    const badMastery = `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="T" version="1"
  xmlns="http://www.imsglobal.org/xsd/imscp_v1p1"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_v1p3">
  <metadata><schema>ADL SCORM</schema><schemaversion>1.2</schemaversion></metadata>
  <organizations default="ORG-1"><organization identifier="ORG-1"><title>Versioned</title>
    <item identifier="ITEM-1" identifierref="RES-1"><title>SCO</title><adlcp:masteryscore>150</adlcp:masteryscore></item>
  </organization></organizations>
  <resources><resource identifier="RES-1" type="webcontent" adlcp:scormType="sco" href="sco.html">
    <file href="sco.html"/>
  </resource></resources>
</manifest>`;
    expect(parseScormManifest(badMastery, ['sco.html']).units[0].masteryScoreRaw).toBeNull();
  });

  it('reads SCORM 1.2 maxtimeallowed and timelimitaction into formatDetails', () => {
    const xml = manifestWith(
      '<schemaversion>1.2</schemaversion>',
      '<adlcp:maxtimeallowed>00:45:00</adlcp:maxtimeallowed><adlcp:timelimitaction>exit,message</adlcp:timelimitaction>'
    );
    const parsed = parseScormManifest(xml, ['sco.html']);

    expect(parsed.units[0].formatDetails).toEqual({
      format: 'scorm12',
      maxTimeAllowed: '00:45:00',
      timeLimitAction: 'exit,message'
    });
  });

  it('reads 4th-edition threshold attributes', () => {
    const onItem = manifestWith('<schemaversion>2004 4th Edition</schemaversion>', '').replace(
      '<item identifier="ITEM-1" identifierref="RES-1">',
      '<item identifier="ITEM-1" identifierref="RES-1" adlcp:minProgressMeasure="0.75">'
    );
    expect(parseScormManifest(onItem, ['sco.html']).units[0].completionThreshold).toBe(0.75);

    const onElement = manifestWith(
      '<schemaversion>2004 4th Edition</schemaversion>',
      '<adlcp:completionThreshold adlcp:minProgressMeasure="0.6"/>'
    );
    expect(parseScormManifest(onElement, ['sco.html']).units[0].completionThreshold).toBe(0.6);
  });

  it('flags packages that declare prerequisites', () => {
    const plain = parseScormManifest(manifestWith('<schemaversion>1.2</schemaversion>'), ['sco.html']);
    expect(plain.warnings).not.toContain('has_prerequisites');

    const gated = manifestWith(
      '<schemaversion>1.2</schemaversion>',
      '<prerequisites type="aicc_script">ITEM-1</prerequisites>'
    );
    expect(parseScormManifest(gated, ['sco.html']).warnings).toContain('has_prerequisites');
  });
});

describe('parseScormManifest parameters', () => {
  it('reads the item parameters attribute', () => {
    const xml = manifestWith('<schemaversion>1.2</schemaversion>').replace(
      'identifierref="RES-1"',
      'identifierref="RES-1" parameters="?questions=Playing"'
    );

    expect(parseScormManifest(xml, ['sco.html']).units[0].parameters).toBe('?questions=Playing');
    expect(
      parseScormManifest(manifestWith('<schemaversion>1.2</schemaversion>'), ['sco.html']).units[0].parameters
    ).toBeNull();
  });
});

describe('scormLaunchUrl', () => {
  it.each([
    ['sco.html', null, 'sco.html'],
    ['sco.html', '', 'sco.html'],
    ['sco.html', '?questions=Playing', 'sco.html?questions=Playing'],
    ['sco.html', 'questions=Playing', 'sco.html?questions=Playing'],
    ['sco.html', '&a=1', 'sco.html?a=1'],
    ['sco.html?lang=en', '?a=1', 'sco.html?lang=en&a=1'],
    ['sco.html', '#page2', 'sco.html#page2'],
    ['sco.html#intro', '#page2', 'sco.html#intro']
  ])('joins %s with %s', (href, parameters, expected) => {
    expect(scormLaunchUrl(href, parameters)).toBe(expected);
  });
});

describe('launch href encoding', () => {
  it('percent-encodes each path segment exactly once and keeps query and hash suffixes', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="T" version="1"
  xmlns="http://www.imsglobal.org/xsd/imscp_v1p1"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_v1p3">
  <metadata><schema>ADL SCORM</schema><schemaversion>1.2</schemaversion></metadata>
  <organizations default="ORG-1"><organization identifier="ORG-1"><title>Encoded</title>
    <item identifier="ITEM-1" identifierref="RES-1"><title>SCO</title></item>
  </organization></organizations>
  <resources><resource identifier="RES-1" type="webcontent" adlcp:scormType="sco" href="module%201/100%25.html?lang=en#page2">
    <file href="module 1/100%.html"/>
  </resource></resources>
</manifest>`;

    const parsed = parseScormManifest(xml, ['module 1/100%.html']);

    expect(parsed.units[0].href).toBe('module%201/100%25.html?lang=en#page2');
  });
});

describe('parseScormManifest entities', () => {
  it('decodes XML entities in package and unit titles', () => {
    const parsed = parseScormManifest(readSource('scorm-timer-test'), ['index.html']);

    expect(parsed.title).toBe('ClassroomIO Timed Assessment & Session Tracker');
    expect(parsed.units[0].title).toBe('Timed Quiz & Live Session Timer Test');
  });

  it('reads the 2004 timer fields: pass mark, launch data and time limit', () => {
    const parsed = parseScormManifest(readSource('scorm2004-timer'), ['index.html']);

    expect(parsed.format).toBe('scorm2004_4');
    expect(parsed.title).toBe('ClassroomIO SCORM 2004 timer fixture');
    expect(parsed.units).toHaveLength(1);
    expect(parsed.units[0]).toMatchObject({
      unitType: 'sco',
      href: 'index.html',
      passingScoreScaled: 0.8,
      launchData: 'timer_duration=120',
      formatDetails: { format: 'scorm2004', maxTimeAllowed: 'PT2M0S', timeLimitAction: 'exit,message' }
    });
    expect(parsed.warnings).toContain('has_sequencing');
  });
});
