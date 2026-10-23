// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InsightsPoller } from './insights-poller';

describe('InsightsPoller', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
      configurable: true
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('ticks while the tab is visible', () => {
    const onTick = vi.fn();
    const poller = new InsightsPoller(1000, onTick);
    poller.start();

    vi.advanceTimersByTime(3500);
    expect(onTick).toHaveBeenCalledTimes(3);

    poller.stop();
  });

  it('skips ticks while hidden, then fires once on return', () => {
    const onTick = vi.fn();
    const poller = new InsightsPoller(1000, onTick);
    poller.start();

    // Tab becomes hidden
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });

    vi.advanceTimersByTime(3000);
    expect(onTick).toHaveBeenCalledTimes(0);

    // Tab returns to visible
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    expect(onTick).toHaveBeenCalledTimes(1);

    // Subsequent tick runs normally
    vi.advanceTimersByTime(1000);
    expect(onTick).toHaveBeenCalledTimes(2);

    poller.stop();
  });

  it('stop() stops interval and removes event listener', () => {
    const onTick = vi.fn();
    const poller = new InsightsPoller(1000, onTick);
    poller.start();

    poller.stop();

    vi.advanceTimersByTime(5000);
    expect(onTick).toHaveBeenCalledTimes(0);

    // Visibility change does not trigger ticks after stop
    document.dispatchEvent(new Event('visibilitychange'));
    expect(onTick).toHaveBeenCalledTimes(0);
  });
});
