/**
 * Scores the reader's outline and the corpus exclusions against person-made labels (results.md §4).
 * For each site with eval-data/<site>/tree-labels.json and exclusion-labels.json, replays `readSource` on the labelled
 * source from the disk cache only (`--offline` behaviour of read-sites.mjs: no request is sent, no model is called),
 * builds the corpus with `buildCorpus`, and compares:
 *   - tree: every labelled node (group or page) the reader also has is placed correctly when its parent matches the
 *     labelled parent (or a group that also lists it; a top-level node may sit under the root page or at the top) and
 *     the labelled sibling before it is also the sibling before it in the reader's order. Tree accuracy is the share
 *     of labelled nodes present in the reader's tree that are placed correctly; coverage is the share present at all.
 *   - exclusions: each labelled article's keep or exclude against the corpus (release notes, kept only as a reference,
 *     count as excluded), the reason where both exclude, and listing pages the corpus would teach.
 * The replayed corpus is checked against the `corpusPages` that read-sites.mjs saved in eval-data/<site>/read.json, so
 * a reader change since that run shows up as drift instead of silently changing the scores.
 * Writes eval-data/score-labels.json with every disagreement. Needs a build of the package.
 * Progress every 30 s; stops reading at `--deadline-minutes` (default 6).
 * Run: node eval/score-labels.mjs [--only=domain,...]
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { withDiskCache } from './http-cache.mjs';

import { buildCorpus, createFetcher, normalizePageUrl, readSource, registrableDomain } from '../dist/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const argv = process.argv.slice(2);
const option = (name, fallback) => argv.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const only = option('only', null)?.split(',');
const deadlineMinutes = Number(option('deadline-minutes', 6));
const sites = JSON.parse(readFileSync(join(ROOT, 'eval', 'sites-icp.json'), 'utf8'));
const fetcher = withDiskCache(createFetcher({ productToken: 'ClassroomIO-CourseBuilder-Eval' }), { offline: true });
const startedAt = Date.now();
const deadline = new AbortController();
const deadlineTimer = setTimeout(() => deadline.abort(), deadlineMinutes * 60_000);
deadlineTimer.unref();
const progress = { site: null, read: 0 };
const progressTimer = setInterval(() => {
  const seconds = Math.round((Date.now() - startedAt) / 1000);
  console.log(`[progress ${seconds}s] ${progress.site ?? 'starting'}: ${progress.read} pages replayed from the cache`);
}, 30_000);
progressTimer.unref();

const offlineRenderer = {
  async render() {
    throw new Error('not rendering in this run');
  }
};

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function normalised(url) {
  return url ? normalizePageUrl(url) : null;
}

function asDiscovered(source, domain) {
  const host = new URL(source.url).hostname;

  return {
    kind: source.kind,
    url: source.url,
    title: source.title ?? null,
    foundVia: 'site-link',
    foundAt: source.foundAt ?? source.url,
    redirectChain: [source.landingUrl ?? source.url],
    ownership: registrableDomain(host) === domain ? 'own' : 'foreign',
    evidence: 'linked-from-site',
    access: source.access ?? 'open',
    llmsTxtUrl: source.llmsTxtUrl ?? null,
    sitemapUrls: source.sitemapUrls ?? []
  };
}

async function replaySource(domain, source) {
  progress.site = domain;
  progress.read = 0;
  const result = await readSource({
    onPage: () => {
      progress.read += 1;
    },
    fetcher,
    renderer: offlineRenderer,
    source: asDiscovered(source, domain),
    brandDomain: domain,
    productNames: [sites.organisations[domain]?.name ?? domain],
    preferredLocale: source.locale ?? 'en',
    maxPages: 1500,
    deadlineAt: startedAt + deadlineMinutes * 60_000 - 30_000,
    signal: deadline.signal
  });
  const corpus = buildCorpus(result.tree.pages, source.locale ?? 'en');

  return { result, corpus };
}

/** Each reader page by normalised URL, with its parent's URL and its rank among the reader's siblings. */
function readerIndex(pages) {
  const byId = new Map(pages.map((page) => [page.id, page]));
  const siblings = new Map();
  for (const page of pages) {
    const list = siblings.get(page.parentId) ?? [];
    list.push(page);
    siblings.set(page.parentId, list);
  }
  const rank = new Map();
  for (const list of siblings.values()) {
    list.sort(
      (left, right) =>
        (left.position ?? Number.MAX_SAFE_INTEGER) - (right.position ?? Number.MAX_SAFE_INTEGER) ||
        left.order - right.order
    );
    list.forEach((page, index) => rank.set(page.id, index));
  }
  const byUrl = new Map();
  for (const page of pages) {
    if (!page.url) continue;
    const parent = page.parentId ? byId.get(page.parentId) : null;
    const key = normalised(page.url);
    if (byUrl.has(key)) continue;
    byUrl.set(key, {
      page,
      parentKey: parent ? (parent.url ? normalised(parent.url) : `#${parent.title}`) : null,
      parentTitle: parent?.title ?? null,
      rank: rank.get(page.id)
    });
  }

  return byUrl;
}

/**
 * Compares the reader's tree with the labelled outline. `topKeys` are URLs that stand for the top of the tree (the
 * root and landing pages): a top-level labelled node may sit under one of them.
 */
function scoreTree(labels, pages, topKeys) {
  const reader = readerIndex(pages);
  const nodes = labels.nodes.map((node) => ({
    ...node,
    key: normalised(node.url),
    parentKey: normalised(node.parent),
    acceptedParents: new Set([normalised(node.parent), ...node.alsoListedUnder.map(normalised)])
  }));
  const parentOk = (node, found) =>
    node.parent === null
      ? found.parentKey === null || topKeys.has(found.parentKey)
      : node.acceptedParents.has(found.parentKey);

  const rows = nodes.map((node) => {
    const found = reader.get(node.key);
    if (!found) return { node, present: false };

    return { node, found, present: true, parentCorrect: parentOk(node, found) };
  });
  const byLabelParent = new Map();
  for (const row of rows) {
    const list = byLabelParent.get(row.node.parentKey) ?? [];
    list.push(row);
    byLabelParent.set(row.node.parentKey, list);
  }
  for (const list of byLabelParent.values()) {
    const placed = list
      .filter((row) => row.present && row.parentCorrect)
      .sort((a, b) => a.node.position - b.node.position);
    const readerOrder = [...placed].sort((a, b) => a.found.rank - b.found.rank);
    placed.forEach((row, index) => {
      const labelBefore = index === 0 ? null : placed[index - 1].node.key;
      const readerIndexOf = readerOrder.indexOf(row);
      const readerBefore = readerIndexOf === 0 ? null : readerOrder[readerIndexOf - 1].node.key;
      row.orderCorrect = labelBefore === readerBefore;
      row.labelBefore = labelBefore;
      row.readerBefore = readerBefore;
    });
  }

  const present = rows.filter((row) => row.present);
  const correct = present.filter((row) => row.parentCorrect && row.orderCorrect);
  const share = (part, whole) => (whole ? Number((part / whole).toFixed(4)) : null);
  const byKind = (kind) => {
    const kindRows = present.filter((row) => row.node.kind === kind);

    return {
      present: kindRows.length,
      labelled: rows.filter((row) => row.node.kind === kind).length,
      correct: kindRows.filter((row) => row.parentCorrect && row.orderCorrect).length
    };
  };
  const labelKeys = new Set(nodes.map((node) => node.key));
  const notLabelled = pages.filter(
    (page) => page.url && !labelKeys.has(normalised(page.url)) && !topKeys.has(normalised(page.url))
  );

  return {
    labelled: rows.length,
    present: present.length,
    coverage: share(present.length, rows.length),
    parentAccuracy: share(present.filter((row) => row.parentCorrect).length, present.length),
    treeAccuracy: share(correct.length, present.length),
    pages: byKind('page'),
    groups: byKind('group'),
    missing: rows
      .filter((row) => !row.present)
      .map((row) => ({ url: row.node.url, title: row.node.title, kind: row.node.kind })),
    wrongParent: present
      .filter((row) => !row.parentCorrect)
      .map((row) => ({
        url: row.node.url,
        title: row.node.title,
        kind: row.node.kind,
        labelParent: row.node.parent,
        readerParent: row.found.parentKey,
        readerParentTitle: row.found.parentTitle
      })),
    wrongOrder: present
      .filter((row) => row.parentCorrect && !row.orderCorrect)
      .map((row) => ({
        url: row.node.url,
        title: row.node.title,
        labelBefore: row.labelBefore,
        readerBefore: row.readerBefore
      })),
    readerNodesNotLabelled: notLabelled.map((page) => ({ url: page.url, title: page.title, kind: page.kind }))
  };
}

/** Compares the corpus with the labelled keep or exclude decisions, and with the corpus that read.json recorded. */
function scoreExclusions(labels, corpus, recorded) {
  const corpusByUrl = new Map(corpus.pages.map((page) => [normalised(page.url), page]));
  const decision = (page) => (page.excluded || page.referenceOnly ? 'exclude' : 'keep');
  const rows = labels.pages.map((label) => ({ label, page: corpusByUrl.get(normalised(label.url)) ?? null }));
  const inCorpus = rows.filter((row) => row.page);
  const agree = inCorpus.filter((row) => decision(row.page) === row.label.decision);
  const clear = inCorpus.filter((row) => row.label.confidence === 'clear');
  const count = (labelDecision, corpusDecision) =>
    inCorpus.filter((row) => row.label.decision === labelDecision && decision(row.page) === corpusDecision).length;
  const bothExcluded = inCorpus.filter((row) => row.label.decision === 'exclude' && decision(row.page) === 'exclude');
  const reasonAgrees = (row) =>
    row.page.excluded === row.label.reason || (row.label.acceptableReasons ?? []).includes(row.page.excluded);
  const share = (part, whole) => (whole ? Number((part / whole).toFixed(4)) : null);
  const listingKeys = new Set(labels.listingPages.map(normalised));
  const recordedByUrl = new Map((recorded ?? []).map((page) => [normalised(page.url), page]));

  return {
    labelled: rows.length,
    inCorpus: inCorpus.length,
    agreement: share(agree.length, inCorpus.length),
    agreementOnClear: share(clear.filter((row) => decision(row.page) === row.label.decision).length, clear.length),
    confusion: {
      keepKept: count('keep', 'keep'),
      keepExcluded: count('keep', 'exclude'),
      excludeKept: count('exclude', 'keep'),
      excludeExcluded: count('exclude', 'exclude')
    },
    reasonAgreement: share(bothExcluded.filter(reasonAgrees).length, bothExcluded.length),
    disagreements: inCorpus
      .filter(
        (row) => decision(row.page) !== row.label.decision || (row.label.decision === 'exclude' && !reasonAgrees(row))
      )
      .map((row) => ({
        url: row.label.url,
        title: row.label.title,
        label: row.label.decision,
        labelReason: row.label.reason,
        confidence: row.label.confidence,
        note: row.label.note ?? null,
        labelWords: row.label.words,
        corpus: decision(row.page),
        corpusReason: row.page.excluded,
        corpusWords: row.page.wordCount
      })),
    notInCorpus: rows
      .filter((row) => !row.page)
      .map((row) => ({ url: row.label.url, title: row.label.title, label: row.label.decision })),
    listingPagesTaught: corpus.pages
      .filter((page) => listingKeys.has(normalised(page.url)) && decision(page) === 'keep')
      .map((page) => ({ url: page.url, title: page.title, words: page.wordCount })),
    driftFromReadJson:
      recorded === null
        ? 'no read.json row for this source'
        : corpus.pages
            .filter((page) => {
              const before = recordedByUrl.get(normalised(page.url));

              return !before || (before.excluded ?? null) !== (page.excluded ?? null);
            })
            .map((page) => ({
              url: page.url,
              now: page.excluded,
              before: recordedByUrl.get(normalised(page.url))?.excluded ?? 'absent'
            }))
  };
}

const domains = sites.split.development.filter(
  (domain) => (!only || only.includes(domain)) && existsSync(join(ROOT, 'eval-data', domain, 'tree-labels.json'))
);
const results = [];

for (const domain of domains) {
  const treeLabels = readJson(join(ROOT, 'eval-data', domain, 'tree-labels.json'));
  const exclusionLabels = readJson(join(ROOT, 'eval-data', domain, 'exclusion-labels.json'));
  const truth = readJson(join(ROOT, 'eval-data', domain, 'truth.json'));
  const source = truth.sources.find((entry) => entry.url === treeLabels.source);
  const readRows = existsSync(join(ROOT, 'eval-data', domain, 'read.json'))
    ? readJson(join(ROOT, 'eval-data', domain, 'read.json'))
    : [];
  const recorded = readRows.find((row) => row.url === treeLabels.source)?.corpusPages ?? null;
  const sourceStartedAt = Date.now();
  const { result, corpus } = await replaySource(domain, source);
  const topKeys = new Set(
    [
      treeLabels.root,
      source.url,
      source.landingUrl,
      ...treeLabels.notInNavigation.filter((entry) => entry.note === 'a landing page').map((entry) => entry.url)
    ]
      .filter(Boolean)
      .map(normalised)
  );
  const tree = scoreTree(treeLabels, result.tree.pages, topKeys);
  const exclusions = scoreExclusions(exclusionLabels, corpus, recorded);
  results.push({
    domain,
    source: source.url,
    outcome: result.outcome,
    readerPages: result.tree.pages.length,
    placedBy: result.placedBy,
    seconds: Math.round((Date.now() - sourceStartedAt) / 1000),
    tree,
    exclusions
  });
  console.log(
    `${domain}  ${source.url}\n` +
      `  tree: ${tree.present}/${tree.labelled} labelled nodes in the reader's tree; parent ${tree.parentAccuracy}, ` +
      `tree accuracy ${tree.treeAccuracy} (pages ${tree.pages.correct}/${tree.pages.present}, groups ${tree.groups.correct}/${tree.groups.present}); ` +
      `${tree.wrongParent.length} wrong parent, ${tree.wrongOrder.length} wrong order, ${tree.readerNodesNotLabelled.length} reader nodes not labelled\n` +
      `  exclusions: ${exclusions.inCorpus}/${exclusions.labelled} labelled pages in the corpus; agreement ${exclusions.agreement} ` +
      `(clear labels ${exclusions.agreementOnClear}); keep/kept ${exclusions.confusion.keepKept}, keep/excluded ${exclusions.confusion.keepExcluded}, ` +
      `exclude/kept ${exclusions.confusion.excludeKept}, exclude/excluded ${exclusions.confusion.excludeExcluded}; reason agreement ${exclusions.reasonAgreement}; ` +
      `${exclusions.listingPagesTaught.length} listing pages taught; drift from read.json ${Array.isArray(exclusions.driftFromReadJson) ? exclusions.driftFromReadJson.length : exclusions.driftFromReadJson}`
  );
}

const totals = results.reduce(
  (sum, row) => ({
    treePresent: sum.treePresent + row.tree.present,
    treeCorrect: sum.treeCorrect + row.tree.pages.correct + row.tree.groups.correct,
    treeLabelled: sum.treeLabelled + row.tree.labelled,
    exclusionsInCorpus: sum.exclusionsInCorpus + row.exclusions.inCorpus,
    exclusionsAgree: sum.exclusionsAgree + row.exclusions.confusion.keepKept + row.exclusions.confusion.excludeExcluded
  }),
  { treePresent: 0, treeCorrect: 0, treeLabelled: 0, exclusionsInCorpus: 0, exclusionsAgree: 0 }
);
const summary = {
  sources: results.length,
  treeAccuracy: totals.treePresent ? Number((totals.treeCorrect / totals.treePresent).toFixed(4)) : null,
  treeCoverage: totals.treeLabelled ? Number((totals.treePresent / totals.treeLabelled).toFixed(4)) : null,
  exclusionAgreement: totals.exclusionsInCorpus
    ? Number((totals.exclusionsAgree / totals.exclusionsInCorpus).toFixed(4))
    : null,
  cache: fetcher.stats,
  seconds: Math.round((Date.now() - startedAt) / 1000)
};
writeFileSync(join(ROOT, 'eval-data', 'score-labels.json'), `${JSON.stringify({ summary, results }, null, 2)}\n`);
console.log(`all: ${JSON.stringify(summary)}\nwritten to eval-data/score-labels.json`);
clearTimeout(deadlineTimer);
