import robotsParser from 'robots-parser';

export interface RobotsRules {
  isAllowed(url: string): boolean;
  crawlDelayMs: number;
  sitemaps: string[];
  /** Content-Signal values that apply to us, e.g. `{ 'ai-input': 'no' }`. See contentsignals.org. */
  contentSignals: Record<string, string>;
  /** Literal paths robots.txt explicitly allows us, e.g. `/wiki/`. */
  allowPaths: string[];
}

export const ALLOW_ALL_ROBOTS: RobotsRules = {
  isAllowed: () => true,
  crawlDelayMs: 0,
  sitemaps: [],
  contentSignals: {},
  allowPaths: []
};

export const DISALLOW_ALL_ROBOTS: RobotsRules = {
  isAllowed: () => false,
  crawlDelayMs: 0,
  sitemaps: [],
  contentSignals: {},
  allowPaths: []
};

function agentApplies(agent: string, productToken: string): boolean {
  const normalized = agent.trim().toLowerCase();

  return normalized === '*' || productToken.toLowerCase().startsWith(normalized);
}

/** Values of one field from the groups that apply to `productToken`, and from outside any group. */
function fieldValues(robotsText: string, productToken: string, wantedField: string): string[] {
  const values: string[] = [];
  let groupAgents: string[] = [];
  let groupHasRules = false;

  for (const rawLine of robotsText.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    const separator = line.indexOf(':');
    if (separator < 0) continue;

    const field = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();

    if (field === 'user-agent') {
      if (groupHasRules) groupAgents = [];
      groupAgents.push(value);
      groupHasRules = false;
      continue;
    }

    groupHasRules = true;
    if (field !== wantedField) continue;

    const applies = groupAgents.length === 0 || groupAgents.some((agent) => agentApplies(agent, productToken));
    if (applies && value) values.push(value);
  }

  return values;
}

/** Reads Content-Signal lines from groups that apply to `productToken`, and from outside any group. */
export function parseContentSignals(robotsText: string, productToken: string): Record<string, string> {
  const signals: Record<string, string> = {};

  for (const value of fieldValues(robotsText, productToken, 'content-signal')) {
    for (const pair of value.split(',')) {
      const [name, setting] = pair.split('=').map((part) => part.trim().toLowerCase());
      if (name && setting) signals[name] = setting;
    }
  }

  return signals;
}

/** Literal `Allow:` paths that apply to `productToken`, without wildcards. Used as entry points, never as permission. */
export function parseAllowPaths(robotsText: string, productToken: string): string[] {
  const paths = fieldValues(robotsText, productToken, 'allow').filter(
    (path) => path.startsWith('/') && path !== '/' && !/[*$]/.test(path)
  );

  return [...new Set(paths)];
}

export function parseRobots(robotsUrl: string, robotsText: string, productToken: string): RobotsRules {
  const parser = robotsParser(robotsUrl, robotsText);
  const crawlDelaySeconds = parser.getCrawlDelay(productToken) ?? 0;

  return {
    isAllowed: (url) => parser.isAllowed(url, productToken) !== false,
    crawlDelayMs: crawlDelaySeconds * 1000,
    sitemaps: parser.getSitemaps(),
    contentSignals: parseContentSignals(robotsText, productToken),
    allowPaths: parseAllowPaths(robotsText, productToken)
  };
}
