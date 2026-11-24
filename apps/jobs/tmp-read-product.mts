import { createFetcher, discoverSources, readStage } from '@cio/course-builder';
import { createRenderer } from '/Users/user/Documents/ClassroomIO/Dev/Codebases/classroomio/apps/jobs/src/services/course-builder/renderer';

const site = process.argv[2];
const fetcher = createFetcher({ productToken: 'ClassroomIO-CourseBuilder-Eval' });
const inner = createRenderer({ userAgent: 'ClassroomIO-CourseBuilder-Eval/0.1 (+https://classroomio.com)' });
let renders = 0;
const renderer = {
  async render(url: string, options: { timeoutMs: number }) {
    const started = Date.now();
    try {
      const result = await inner.render(url, options);
      console.log(`render ${((Date.now() - started) / 1000).toFixed(1)}s ${result.status} ${url}`);
      return result;
    } catch (error) {
      console.log(`render FAILED ${((Date.now() - started) / 1000).toFixed(1)}s ${url} ${String(error).slice(0, 120)}`);
      throw error;
    } finally {
      renders += 1;
    }
  }
};
const started = Date.now();
const map = await discoverSources(site, { fetcher });
console.log(
  `discover ${((Date.now() - started) / 1000).toFixed(1)}s`,
  map.sources.map((s) => `${s.kind} ${s.url}`),
  'skipped',
  map.skipped.length
);
const product = map.sources.find((s) => s.kind === 'product-site');
if (product) {
  const readStart = Date.now();
  let pages = 0;
  const read = await readStage({
    source: product,
    sourceMap: map,
    fetcher,
    renderer,
    locale: 'en',
    maxPages: 25,
    onPage: () => {
      pages += 1;
    }
  }).catch((e) => {
    console.log('read error', String(e));
    return null;
  });
  console.log(
    `product read ${((Date.now() - readStart) / 1000).toFixed(1)}s pages ${pages} renders ${renders} outcome ${read?.outcome}`
  );
}
await inner.close();
process.exit(0);
