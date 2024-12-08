import { describe, it, expect, beforeEach } from 'vitest';
import { toggleBodyByMode } from './toggleMode';

describe('toggleBodyByMode', () => {
  // Reset the document.body.className before each test
  beforeEach(() => {
    document.body.className = '';
  });

  it('should add dark class when isDark is true', () => {
    toggleBodyByMode(true);
    expect(document.body.className).toContain('dark');
  });

  it('should remove dark class when isDark is false', () => {
    // First add the dark class
    document.body.className = 'some-class dark other-class';

    // Then remove it
    toggleBodyByMode(false);
    expect(document.body.className).not.toContain('dark');
    expect(document.body.className).toContain('some-class');
    expect(document.body.className).toContain('other-class');
  });


  it('should handle empty class name', () => {
    document.body.className = '';

    toggleBodyByMode(true);
    expect(document.body.className.trim()).toBe('dark');
  });

  it('should preserve existing classes when adding dark mode', () => {
    document.body.className = 'existing-class another-class';

    toggleBodyByMode(true);
    expect(document.body.className).toContain('existing-class');
    expect(document.body.className).toContain('another-class');
    expect(document.body.className).toContain('dark');
  });
});
