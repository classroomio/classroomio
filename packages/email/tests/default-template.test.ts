import { describe, expect, it } from 'vitest';

import { getDefaultTemplate } from '../src/templates';

describe('getDefaultTemplate', () => {
  it('uses system-owned English footer copy by default', () => {
    const rendered = getDefaultTemplate('<p>System email</p>');

    expect(rendered).toContain('All rights reserved.');
    expect(rendered).toContain('Website');
  });

  it('accepts localized footer copy for student emails', () => {
    const rendered = getDefaultTemplate('<p>Courriel étudiant</p>', undefined, 'fr', {
      rightsReserved: 'Tous droits réservés.',
      website: 'Site web',
      terms: 'Conditions',
      privacy: 'Confidentialité'
    });

    expect(rendered).toContain('Tous droits réservés.');
    expect(rendered).toContain('Site web');
  });
});
