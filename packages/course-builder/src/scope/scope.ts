export interface BuildScope {
  startUrls: string[];
  /** Stay within these URL prefixes when set; otherwise each source's own root. */
  prefixes?: string[];
  include?: string[];
  exclude?: string[];
  maxPagesPerSource: number;
  locale: string;
  audience?: string;
  courseCount: number;
  budgetUsd: number;
}

export interface SourceScope {
  /** Host plus path prefix, e.g. `https://help.acme.com/` or `https://acme.com/docs`. */
  root: string;
  /** Hosts the source's own pages redirected to during discovery or reading. */
  extraHosts: Set<string>;
  include: RegExp[];
  exclude: RegExp[];
}

function globToRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');

  return new RegExp(`^${escaped}$`, 'i');
}

export function sourceScope(root: string, scope: Pick<BuildScope, 'include' | 'exclude'>): SourceScope {
  return {
    root,
    extraHosts: new Set(),
    include: (scope.include ?? []).map(globToRegExp),
    exclude: (scope.exclude ?? []).map(globToRegExp)
  };
}

function parseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function withoutTrailingSlash(path: string): string {
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
}

/** Whether a URL belongs to a source: under its root path or on a host it redirected to, and allowed by its patterns. */
export function inScope(url: string, scope: SourceScope): boolean {
  const parsed = parseUrl(url);
  const root = parseUrl(scope.root);
  if (!parsed || !root || !/^https?:$/.test(parsed.protocol)) return false;

  const rootPath = withoutTrailingSlash(root.pathname);
  const path = withoutTrailingSlash(parsed.pathname);
  const underRoot =
    parsed.host === root.host && (rootPath === '/' || path === rootPath || path.startsWith(`${rootPath}/`));
  const onExtraHost = scope.extraHosts.has(parsed.host);
  if (!underRoot && !onExtraHost) return false;
  if (scope.exclude.some((pattern) => pattern.test(url))) return false;

  return scope.include.length === 0 || scope.include.some((pattern) => pattern.test(url));
}
