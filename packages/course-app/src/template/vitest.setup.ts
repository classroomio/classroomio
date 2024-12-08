import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock SvelteKit modules
vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
  invalidate: vi.fn(),
  prefetch: vi.fn(),
  beforeNavigate: vi.fn(),
  afterNavigate: vi.fn()
}));

vi.mock('$app/environment', () => ({
  browser: true,
  dev: true,
  building: false
}));

vi.mock('$app/stores', () => ({
  page: vi.fn(),
  navigating: vi.fn(),
  updated: vi.fn()
}));

// Simply mock all carbon icons as empty components
vi.mock('carbon-icons-svelte', () => ({}), { virtual: true });

// Browser APIs
window.matchMedia =
  window.matchMedia ||
  (() => ({
    matches: false,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }));

window.ResizeObserver =
  window.ResizeObserver ||
  vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }));

window.IntersectionObserver =
  window.IntersectionObserver ||
  vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }));
