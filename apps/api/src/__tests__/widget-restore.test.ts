import { describe, expect, it } from 'vitest';
import { resolveRestoredWidgetStatus } from '@api/services/widget';

describe('resolveRestoredWidgetStatus', () => {
  it('restores to PUBLISHED when the widget had a live published version', () => {
    expect(resolveRestoredWidgetStatus('11111111-1111-4111-8111-111111111111')).toBe('PUBLISHED');
  });

  it('restores to DRAFT when the widget was never published', () => {
    expect(resolveRestoredWidgetStatus(null)).toBe('DRAFT');
  });
});
