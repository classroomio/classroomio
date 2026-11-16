import type { JsxGraphApi } from './jsxgraph-types';

let pendingJsxGraph: Promise<JsxGraphApi> | null = null;

/** Loads JSXGraph on first use so it stays out of every bundle that never shows a graph; browser only. */
export function loadJsxGraph(): Promise<JsxGraphApi> {
  pendingJsxGraph ??= import('jsxgraph').then((module) => module.default);

  return pendingJsxGraph;
}

let pendingGraphFunctions: Promise<typeof import('@cio/question-types/graph-functions')> | null = null;

/** Loads the Compute Engine function compiler on first use. */
export function loadGraphFunctions() {
  pendingGraphFunctions ??= import('@cio/question-types/graph-functions');

  return pendingGraphFunctions;
}
