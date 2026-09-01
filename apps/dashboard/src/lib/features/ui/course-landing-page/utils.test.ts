import { resolveCourseNavItems } from './utils';

describe('resolveCourseNavItems', () => {
  it('routes anchor-only hrefs through the org home page', () => {
    expect(resolveCourseNavItems([{ label: 'Contact', href: '#contact' }])).toEqual([
      { label: 'Contact', href: '/#contact' }
    ]);
  });

  it('leaves regular page links untouched', () => {
    const navItems = [
      { label: 'Courses', href: '/courses' },
      { label: 'Docs', href: 'https://docs.example.com' }
    ];

    expect(resolveCourseNavItems(navItems)).toEqual(navItems);
  });
});
