import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { PackageError } from '../../errors.js';

export type ScormPackageFormat = 'scorm12' | 'scorm2004_2' | 'scorm2004_3' | 'scorm2004_4';
export type ScormUnitType = 'sco' | 'asset';
export type ScormPackageWarning =
  | 'has_sequencing'
  | 'has_prerequisites'
  | 'manifest_rebased'
  | 'href_case_fixed'
  | 'no_lms_api_detected';

export interface ScormUnitFormatDetails2004 {
  format: 'scorm2004';
  maxTimeAllowed: string | null;
  timeLimitAction: string | null;
}

export interface ScormUnitFormatDetails12 {
  format: 'scorm12';
  maxTimeAllowed?: string | null;
  timeLimitAction?: string | null;
}

export type ScormUnitFormatDetails = ScormUnitFormatDetails2004 | ScormUnitFormatDetails12;

export interface ScormPackageUnit {
  identifier: string;
  parentIdentifier: string | null;
  title: string;
  position: number;
  unitType: ScormUnitType;
  href: string;
  parameters: string | null;
  masteryScoreRaw: number | null;
  passingScoreScaled: number | null;
  completionThreshold: number | null;
  launchData: string | null;
  formatDetails: ScormUnitFormatDetails;
  isVisible: boolean;
}

export interface ParsedScormPackage {
  format: ScormPackageFormat;
  manifestIdentifier: string | null;
  title: string | null;
  units: ScormPackageUnit[];
  warnings: ScormPackageWarning[];
}

const manifestParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseAttributeValue: false,
  trimValues: true,
  processEntities: true,
  htmlEntities: true
});

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function textOf(node: unknown): string {
  if (node === null || node === undefined) {
    return '';
  }

  if (typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') {
    return String(node);
  }

  if (typeof node === 'object' && '#text' in (node as Record<string, unknown>)) {
    return textOf((node as Record<string, unknown>)['#text']);
  }

  return '';
}

function localName(key: string): string {
  return (key.split(':').pop() ?? key).toLowerCase();
}

function readAttr(node: unknown, name: string): unknown {
  if (typeof node !== 'object' || node === null) {
    return undefined;
  }

  const target = name.toLowerCase();

  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (!key.startsWith('@_')) {
      continue;
    }

    const full = key.slice(2).toLowerCase();
    if (full === target || full.split(':').pop() === target) {
      return value;
    }
  }

  return undefined;
}

function readAttrText(node: unknown, name: string): string {
  return textOf(readAttr(node, name));
}

function findDescendants(node: unknown, name: string): unknown[] {
  const target = name.toLowerCase();
  const found: unknown[] = [];

  const visit = (current: unknown): void => {
    if (typeof current !== 'object' || current === null) {
      return;
    }

    for (const [key, value] of Object.entries(current as Record<string, unknown>)) {
      if (key.startsWith('@_') || key === '#text') {
        continue;
      }

      const items = asArray(value);

      if (localName(key) === target) {
        found.push(...items);
      }

      for (const item of items) {
        visit(item);
      }
    }
  };

  visit(node);

  return found;
}

function parseScoreNumber(raw: string): number | null {
  if (!raw) {
    return null;
  }

  const parsed = Number.parseFloat(raw);

  return Number.isFinite(parsed) ? parsed : null;
}

function attrTrue(node: unknown, name: string): boolean {
  const raw = readAttr(node, name);

  if (typeof raw === 'boolean') {
    return raw;
  }

  return textOf(raw).toLowerCase() === 'true';
}

function detectFormat(manifest: Record<string, unknown>): ScormPackageFormat {
  const metadata = (manifest['metadata'] ?? {}) as Record<string, unknown>;
  const schemaVersion = textOf(metadata['schemaversion']).trim();

  if (schemaVersion) {
    if (/\b1\.2\b/.test(schemaVersion)) {
      return 'scorm12';
    }

    if (/cam\s*1\.3/i.test(schemaVersion) || /2004\s*2nd/i.test(schemaVersion)) {
      return 'scorm2004_2';
    }

    if (/2004.*3rd/i.test(schemaVersion)) {
      return 'scorm2004_3';
    }

    if (/2004.*4th/i.test(schemaVersion)) {
      return 'scorm2004_4';
    }

    if (/2004|1\.3/.test(schemaVersion)) {
      return 'scorm2004_4';
    }

    throw new PackageError('unsupported_version', { schemaversion: schemaVersion });
  }

  const namespaces: string[] = [];

  for (const [key, value] of Object.entries(manifest)) {
    if (key.startsWith('@_xmlns')) {
      namespaces.push(textOf(value));
    }
  }

  if (namespaces.some((namespace) => namespace.includes('adlcp_rootv1p2'))) {
    return 'scorm12';
  }

  if (namespaces.some((namespace) => namespace.includes('adlcp_v1p3'))) {
    return 'scorm2004_4';
  }

  return 'scorm12';
}

function isAbsoluteUrl(href: string): boolean {
  return /^(?:[a-zA-Z][a-zA-Z0-9+.-]*:|\/\/)/.test(href);
}

function splitHrefSuffix(href: string): { path: string; suffix: string } {
  const index = href.search(/[?#]/);

  if (index === -1) {
    return { path: href, suffix: '' };
  }

  return { path: href.slice(0, index), suffix: href.slice(index) };
}

function normalizeHrefPath(rawPath: string): string | null {
  let decoded = rawPath;

  try {
    decoded = decodeURIComponent(rawPath);
  } catch {
    decoded = rawPath;
  }

  const forward = decoded.replace(/\\/g, '/').normalize('NFC');
  const trimmed = forward.startsWith('/') ? forward.slice(1) : forward;
  const segments = trimmed.split('/');
  const resolved: string[] = [];

  for (const segment of segments) {
    if (segment === '' || segment === '.') continue;

    if (segment === '..') {
      if (resolved.length === 0) return null;

      resolved.pop();
      continue;
    }

    resolved.push(segment);
  }

  return resolved.join('/');
}

interface UnitCollector {
  units: ScormPackageUnit[];
  warnings: Set<ScormPackageWarning>;
  hrefCaseFixed: boolean;
  hasPrerequisites: boolean;
}

function readScormType(resource: unknown): ScormUnitType {
  return textOf(readAttr(resource, 'scormtype')).toLowerCase() === 'sco' ? 'sco' : 'asset';
}

function readMasteryScoreRaw(resource: unknown, item: unknown): number | null {
  for (const node of [resource, item]) {
    const candidates = findDescendants(node, 'masteryscore');
    for (const candidate of candidates) {
      const parsed = parseScoreNumber(textOf(candidate));
      if (parsed !== null && parsed >= 0 && parsed <= 100) {
        return parsed;
      }
    }
  }

  return null;
}

function readPassingScoreScaled(item: unknown): number | null {
  for (const objective of findDescendants(item, 'primaryobjective')) {
    if (!attrTrue(objective, 'satisfiedbymeasure')) {
      continue;
    }

    for (const measure of findDescendants(objective, 'minnormalizedmeasure')) {
      const parsed = parseScoreNumber(textOf(measure));
      if (parsed !== null && parsed >= -1 && parsed <= 1) {
        return parsed;
      }
    }
  }

  return null;
}

function readCompletionThreshold(item: unknown): number | null {
  for (const threshold of findDescendants(item, 'completionthreshold')) {
    const parsed = parseScoreNumber(textOf(threshold));
    if (parsed !== null && parsed >= 0 && parsed <= 1) {
      return parsed;
    }

    const fromAttr = parseScoreNumber(textOf(readAttr(threshold, 'minprogressmeasure')));
    if (fromAttr !== null && fromAttr >= 0 && fromAttr <= 1) {
      return fromAttr;
    }
  }

  const itemAttr = parseScoreNumber(textOf(readAttr(item, 'minprogressmeasure')));
  if (itemAttr !== null && itemAttr >= 0 && itemAttr <= 1) {
    return itemAttr;
  }

  return null;
}

function readFormatDetails(item: unknown, format: ScormPackageFormat): ScormUnitFormatDetails {
  const maxTimeAllowed =
    findDescendants(item, 'maxtimeallowed')
      .map((node) => textOf(node))
      .find((text) => text !== '') ?? null;
  const timeLimitAction =
    findDescendants(item, 'timelimitaction')
      .map((node) => textOf(node))
      .find((text) => text !== '') ?? null;

  if (format === 'scorm12') {
    return {
      format: 'scorm12',
      ...(maxTimeAllowed !== null ? { maxTimeAllowed } : {}),
      ...(timeLimitAction !== null ? { timeLimitAction } : {})
    };
  }

  return { format: 'scorm2004', maxTimeAllowed, timeLimitAction };
}

function readSubtreeText(root: unknown, name: string): string | null {
  const found = findDescendants(root, name)
    .map((node) => textOf(node))
    .find((text) => text !== '');

  return found ?? null;
}

function collectUnits(
  items: unknown[],
  resources: Map<string, unknown>,
  files: string[],
  prefix: string,
  xmlBase: string,
  parentIdentifier: string | null,
  collector: UnitCollector,
  format: ScormPackageFormat
): void {
  for (const rawItem of items) {
    if (typeof rawItem !== 'object' || rawItem === null) {
      continue;
    }

    const item = rawItem as Record<string, unknown>;
    const identifier = readAttrText(item, 'identifier');
    const identifierref = readAttrText(item, 'identifierref');
    const resource = identifierref ? resources.get(identifierref) : undefined;

    if (readSubtreeText(item, 'prerequisites')) {
      collector.hasPrerequisites = true;
    }

    if (resource && typeof resource === 'object') {
      const unitType = readScormType(resource);
      const resourceHref = readAttrText(resource, 'href');
      const resourceBase = readAttrText(resource, 'xml:base');
      const combinedHref = isAbsoluteUrl(resourceHref) ? resourceHref : `${xmlBase}${resourceBase}${resourceHref}`;

      if (!resourceHref) {
        throw new PackageError('missing_launch', { identifier, identifierref });
      }

      if (isAbsoluteUrl(combinedHref)) {
        throw new PackageError('external_launch', { identifier, href: combinedHref });
      }

      const { path: hrefPath, suffix } = splitHrefSuffix(combinedHref);
      const normalizedHref = normalizeHrefPath(hrefPath);
      if (normalizedHref === null) {
        throw new PackageError('missing_launch', { identifier, href: combinedHref });
      }

      const storagePath = `${prefix}${normalizedHref}`;
      const exact = files.includes(storagePath);
      const fallback = exact ? storagePath : files.find((name) => name.toLowerCase() === storagePath.toLowerCase());

      if (!fallback) {
        throw new PackageError('missing_launch', { identifier, href: combinedHref });
      }

      if (!exact) {
        collector.hrefCaseFixed = true;
      }

      const parameters = readAttrText(item, 'parameters') || null;
      const launchData = readSubtreeText(resource, 'datafromlms') ?? readSubtreeText(item, 'datafromlms');
      const title = textOf(item['title']) || identifier || identifierref;
      const visibleRaw = readAttr(item, 'isvisible');
      const isVisible = typeof visibleRaw === 'boolean' ? visibleRaw : textOf(visibleRaw).toLowerCase() !== 'false';

      collector.units.push({
        identifier: identifier || identifierref,
        parentIdentifier,
        title,
        position: collector.units.length,
        unitType,
        href: `${fallback}${suffix}`,
        parameters,
        masteryScoreRaw: readMasteryScoreRaw(resource, item),
        passingScoreScaled: readPassingScoreScaled(item),
        completionThreshold: readCompletionThreshold(item),
        launchData,
        formatDetails: readFormatDetails(item, format),
        isVisible
      });
    }

    const children = asArray(item['item'] as unknown);
    if (children.length > 0) {
      collectUnits(children, resources, files, prefix, xmlBase, identifier || parentIdentifier, collector, format);
    }
  }
}

/**
 * Joins a unit's launch href with its manifest `parameters` per the SCORM CAM
 * content-packaging algorithm.
 */
export function scormLaunchUrl(href: string, parameters: string | null): string {
  const trimmed = (parameters ?? '').replace(/^[?&]+/, '');

  if (!trimmed) return href;

  if (trimmed.startsWith('#')) {
    return href.includes('#') ? href : `${href}${trimmed}`;
  }

  return href.includes('?') ? `${href}&${trimmed}` : `${href}?${trimmed}`;
}

/**
 * Parses a SCORM manifest against a ZIP entry listing. Throws PackageError
 * with a specific code for every rejection in the PRD processing table.
 */
export function parseScormManifest(xml: string, files: string[], prefix = ''): ParsedScormPackage {
  if (/<!DOCTYPE/i.test(xml)) {
    throw new PackageError('doctype_rejected');
  }

  let parsed: unknown;

  try {
    if (XMLValidator.validate(xml) !== true) {
      throw new PackageError('invalid_xml');
    }

    parsed = manifestParser.parse(xml);
  } catch (error) {
    if (error instanceof PackageError) {
      throw error;
    }

    throw new PackageError('invalid_xml');
  }

  if (typeof parsed !== 'object' || parsed === null || !('manifest' in (parsed as Record<string, unknown>))) {
    throw new PackageError('invalid_xml');
  }

  const manifest = (parsed as Record<string, unknown>)['manifest'] as Record<string, unknown>;
  const format = detectFormat(manifest);
  const organizations = asArray(manifest['organizations'] as unknown)[0] as Record<string, unknown> | undefined;
  const orgNodes = organizations ? asArray(organizations['organization'] as unknown) : [];
  const defaultOrg = readAttrText(organizations ?? {}, 'default');
  const organization = (orgNodes.find((node) => readAttrText(node, 'identifier') === defaultOrg) ?? orgNodes[0]) as
    | Record<string, unknown>
    | undefined;

  const resourcesNode = manifest['resources'] as Record<string, unknown> | undefined;
  const resourceNodes = asArray(resourcesNode?.['resource'] as unknown);
  const resources = new Map<string, unknown>();

  for (const resource of resourceNodes) {
    const identifier = readAttrText(resource, 'identifier');
    if (identifier && !resources.has(identifier)) {
      resources.set(identifier, resource);
    }
  }

  const collector: UnitCollector = { units: [], warnings: new Set(), hrefCaseFixed: false, hasPrerequisites: false };
  const rootItems = organization ? asArray(organization['item'] as unknown) : [];
  const xmlBase = `${readAttrText(manifest, 'xml:base')}${readAttrText(resourcesNode ?? {}, 'xml:base')}`;

  collectUnits(rootItems, resources, files, prefix, xmlBase, null, collector, format);

  if (!collector.units.some((unit) => unit.unitType === 'sco')) {
    throw new PackageError('assets_only');
  }

  const warnings: ScormPackageWarning[] = [];

  if (findDescendants(organizations ?? {}, 'sequencing').length > 0) {
    warnings.push('has_sequencing');
  }

  if (collector.hasPrerequisites) {
    warnings.push('has_prerequisites');
  }

  if (prefix !== '') {
    warnings.push('manifest_rebased');
  }

  if (collector.hrefCaseFixed) {
    warnings.push('href_case_fixed');
  }

  return {
    format,
    manifestIdentifier: readAttrText(manifest, 'identifier') || null,
    title: (organization ? textOf(organization['title']) : '') || null,
    units: collector.units,
    warnings
  };
}
