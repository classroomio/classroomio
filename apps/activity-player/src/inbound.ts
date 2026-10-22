export interface PlayerUiUnit {
  identifier: string;
  title: string;
  completed: boolean;
  locked: boolean;
}

export interface PlayerUiLabels {
  previous: string;
  next: string;
  menu: string;
  position: string;
  complete: string;
  locked: string;
  exitFullscreen: string;
  timeLimit: string;
  loading: string;
  didNotConnect: string;
  loadFailed: string;
  videoFullscreenHint: string;
  dismiss: string;
}

/**
 * What the embedder renders through the player: its modules, which one is
 * open, translated copy and theme colors.
 */
export interface PlayerUiState {
  units: PlayerUiUnit[];
  currentIdentifier: string | null;
  timeLimit: string | null;
  labels: PlayerUiLabels;
  theme: Record<string, string>;
}

export type HostImmersiveMode = 'fullscreen' | 'full-window' | null;

export type DashboardMessage =
  | { type: 'player-ui'; ui: PlayerUiState }
  | { type: 'load-launch'; launchToken: string; session: number }
  | { type: 'host-immersive'; mode: HostImmersiveMode }
  | { type: 'request-fullscreen' };

export const THEME_TOKENS = [
  'background',
  'foreground',
  'popover',
  'popover-foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'border',
  'ring',
  'radius'
] as const;

export const DEFAULT_LABELS: PlayerUiLabels = {
  previous: 'Previous module',
  next: 'Next module',
  menu: 'Modules',
  position: '',
  complete: '',
  locked: 'Complete the previous modules first',
  exitFullscreen: 'Exit full screen',
  timeLimit: '',
  loading: 'Loading package…',
  didNotConnect: 'The package did not connect',
  loadFailed: 'The package could not be opened',
  videoFullscreenHint: "Videos here can't go full screen while the activity is full screen.",
  dismiss: 'Dismiss'
};

// Matches the archive entry ceiling enforced while a package is uploaded.
const MAX_UNITS = 10_000;
const MAX_TEXT = 500;
const MAX_THEME_VALUE = 120;
const LAUNCH_TOKEN_PATTERN = /^[A-Za-z0-9._~-]{1,4096}$/;
const THEME_VALUE_PATTERN = /^[\w\s().,%#+\-/*]+$/;

function readText(value: unknown): string | null {
  if (typeof value !== 'string') return null;

  return value.slice(0, MAX_TEXT);
}

function readUnits(value: unknown): PlayerUiUnit[] | null {
  if (!Array.isArray(value) || value.length > MAX_UNITS) return null;

  const units: PlayerUiUnit[] = [];

  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null) return null;

    const record = entry as Record<string, unknown>;
    const identifier = readText(record['identifier']);
    const title = readText(record['title']);

    if (!identifier || title === null) return null;

    units.push({
      identifier,
      title,
      completed: record['completed'] === true,
      locked: record['locked'] === true
    });
  }

  return units;
}

function readLabels(value: unknown): PlayerUiLabels {
  const record = typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
  const labels = { ...DEFAULT_LABELS };

  for (const key of Object.keys(DEFAULT_LABELS) as (keyof PlayerUiLabels)[]) {
    const text = readText(record[key]);
    if (text !== null) labels[key] = text;
  }

  return labels;
}

function readTheme(value: unknown): Record<string, string> {
  const record = typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
  const theme: Record<string, string> = {};

  for (const token of THEME_TOKENS) {
    const raw = record[token];

    if (typeof raw !== 'string') continue;

    const trimmed = raw.trim();
    if (trimmed && trimmed.length <= MAX_THEME_VALUE && THEME_VALUE_PATTERN.test(trimmed)) theme[token] = trimmed;
  }

  return theme;
}

function readUi(value: unknown): PlayerUiState | null {
  if (typeof value !== 'object' || value === null) return null;

  const record = value as Record<string, unknown>;
  const units = readUnits(record['units']);
  if (!units) return null;

  const currentIdentifier = readText(record['currentIdentifier']);
  const timeLimit = readText(record['timeLimit']);

  return {
    units,
    currentIdentifier: currentIdentifier || null,
    timeLimit: timeLimit || null,
    labels: readLabels(record['labels']),
    theme: readTheme(record['theme'])
  };
}

/**
 * Parses a message from the embedding dashboard. Returns null for anything
 * malformed, so callers only check the origin and the source window.
 */
export function parseDashboardMessage(data: unknown): DashboardMessage | null {
  if (typeof data !== 'object' || data === null) return null;

  const record = data as Record<string, unknown>;

  if (record['type'] === 'player-ui') {
    const ui = readUi(record['ui']);

    return ui ? { type: 'player-ui', ui } : null;
  }

  if (record['type'] === 'load-launch') {
    const launchToken = record['launchToken'];
    const session = record['session'];

    if (typeof launchToken !== 'string' || !LAUNCH_TOKEN_PATTERN.test(launchToken)) return null;
    if (typeof session !== 'number' || !Number.isInteger(session) || session < 0) return null;

    return { type: 'load-launch', launchToken, session };
  }

  if (record['type'] === 'host-immersive') {
    const mode = record['mode'];

    return mode === 'fullscreen' || mode === 'full-window' || mode === null ? { type: 'host-immersive', mode } : null;
  }

  if (record['type'] === 'request-fullscreen') return { type: 'request-fullscreen' };

  return null;
}
