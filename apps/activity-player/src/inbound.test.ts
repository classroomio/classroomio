import { describe, expect, it } from 'vitest';
import { DEFAULT_LABELS, parseDashboardMessage } from './inbound';

const units = [
  { identifier: 'm1', title: 'Intro', completed: true, locked: false },
  { identifier: 'm2', title: 'Quiz', completed: false, locked: true }
];

describe('parseDashboardMessage', () => {
  it('parses the player UI state', () => {
    const message = parseDashboardMessage({
      type: 'player-ui',
      ui: {
        units,
        currentIdentifier: 'm1',
        timeLimit: '30m',
        labels: { previous: 'Zurück', position: 'Modul 1 von 2' },
        theme: { background: 'oklch(1 0 0)', radius: '0.625rem' }
      }
    });

    expect(message).toEqual({
      type: 'player-ui',
      ui: {
        units,
        currentIdentifier: 'm1',
        timeLimit: '30m',
        labels: { ...DEFAULT_LABELS, previous: 'Zurück', position: 'Modul 1 von 2' },
        theme: { background: 'oklch(1 0 0)', radius: '0.625rem' }
      }
    });
  });

  it('falls back to English labels and drops unknown fields', () => {
    const message = parseDashboardMessage({
      type: 'player-ui',
      ui: { units: [], currentIdentifier: '', labels: { previous: 42, extra: 'x' }, theme: null }
    });

    expect(message).toEqual({
      type: 'player-ui',
      ui: { units: [], currentIdentifier: null, timeLimit: null, labels: DEFAULT_LABELS, theme: {} }
    });
  });

  it('keeps only known theme tokens with plain color values', () => {
    const message = parseDashboardMessage({
      type: 'player-ui',
      ui: {
        units: [],
        theme: {
          primary: 'oklch(0.488 0.243 264.376)',
          border: 'red; background: url(https://evil.test)',
          'font-family': 'Comic Sans',
          ring: '#a3a3a3'
        }
      }
    });

    expect(message?.type === 'player-ui' && message.ui.theme).toEqual({
      primary: 'oklch(0.488 0.243 264.376)',
      ring: '#a3a3a3'
    });
  });

  it('accepts module menus up to the package entry limit', () => {
    const many = Array.from({ length: 10_000 }, (_, index) => ({
      identifier: `m${index}`,
      title: `Module ${index}`,
      completed: false,
      locked: index > 0
    }));

    expect(parseDashboardMessage({ type: 'player-ui', ui: { units: many } })).not.toBeNull();
    expect(
      parseDashboardMessage({
        type: 'player-ui',
        ui: { units: [...many, { identifier: 'm-over', title: 'Over', completed: false, locked: false }] }
      })
    ).toBeNull();
  });

  it('rejects malformed modules', () => {
    expect(parseDashboardMessage({ type: 'player-ui', ui: { units: [{ title: 'No id' }] } })).toBeNull();
    expect(parseDashboardMessage({ type: 'player-ui', ui: { units: 'm1' } })).toBeNull();
    expect(parseDashboardMessage({ type: 'player-ui' })).toBeNull();
  });

  it('parses a module load with its session number', () => {
    expect(parseDashboardMessage({ type: 'load-launch', launchToken: 'eyJ.abc-_', session: 3 })).toEqual({
      type: 'load-launch',
      launchToken: 'eyJ.abc-_',
      session: 3
    });
  });

  it('rejects module loads with unsafe tokens or invalid sessions', () => {
    expect(parseDashboardMessage({ type: 'load-launch', launchToken: '../state', session: 1 })).toBeNull();
    expect(parseDashboardMessage({ type: 'load-launch', launchToken: 'abc', session: -1 })).toBeNull();
    expect(parseDashboardMessage({ type: 'load-launch', launchToken: 'abc', session: 1.5 })).toBeNull();
    expect(parseDashboardMessage({ type: 'load-launch', session: 1 })).toBeNull();
  });

  it('parses the embedder immersive mode', () => {
    expect(parseDashboardMessage({ type: 'host-immersive', mode: 'fullscreen' })).toEqual({
      type: 'host-immersive',
      mode: 'fullscreen'
    });
    expect(parseDashboardMessage({ type: 'host-immersive', mode: null })).toEqual({
      type: 'host-immersive',
      mode: null
    });
    expect(parseDashboardMessage({ type: 'host-immersive', mode: 'kiosk' })).toBeNull();
    expect(parseDashboardMessage({ type: 'host-immersive' })).toBeNull();
  });

  it('parses a fullscreen request', () => {
    expect(parseDashboardMessage({ type: 'request-fullscreen' })).toEqual({ type: 'request-fullscreen' });
  });

  it('ignores anything else', () => {
    expect(parseDashboardMessage(null)).toBeNull();
    expect(parseDashboardMessage('player-ui')).toBeNull();
    expect(parseDashboardMessage({ type: 'unknown' })).toBeNull();
  });
});
