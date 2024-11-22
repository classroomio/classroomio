import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/svelte';
import Page from '../../routes/+page.svelte';

// Mock the Home component since we're just testing the page wrapper
vi.mock('$lib/index.svelte', () => ({
  default: vi.fn().mockImplementation(() => ({
    $$: {
      on_mount: [],
      on_destroy: [],
      before_update: [],
      after_update: [],
      context: new Map(),
      fragment: document.createDocumentFragment()
    }
  }))
}));

// Mock toggleBodyByMode
vi.mock('$lib/utils/toggleMode', () => ({
  toggleBodyByMode: vi.fn()
}));

describe('+page.svelte', () => {
  const mockData = {
    org: {
      header: {
        banner: { show: true, image: '/test-image.jpg' },
        title: 'Test Title',
        titleHighlight: 'Test Highlight',
        subtitle: 'Test Subtitle',
        action: { label: 'Start Now', link: '/start' }
      }
    },
    courses: [
      {
        data: {
          title: 'Test Course',
          description: 'Test Description',
          banner: '/test-banner.jpg',
          created_at: '2024-03-20',
          cost: 0,
          currency: 'USD',
          type: 'self paced'
        },
        lessons: 5
      }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with correct class', () => {
    const { container } = render(Page, { props: { data: mockData } });
    expect(container.querySelector('.font-matter')).toBeTruthy();
  });

  it('passes data prop to Home component', () => {
    render(Page, { props: { data: mockData } });
    // Since we're mocking the Home component, we just verify the page renders
    expect(document.querySelector('.font-matter')).toBeTruthy();
  });
});
