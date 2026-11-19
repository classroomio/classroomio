import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  checkoutsCreate: vi.fn(),
  env: { POLAR_ACCESS_TOKEN: 'token' as string | undefined },
  isOfferActive: vi.fn(() => true)
}));

vi.mock('@polar-sh/sdk', () => ({
  Polar: class {
    checkouts = { create: mocks.checkoutsCreate };
  }
}));
vi.mock('$app/environment', () => ({ dev: false }));
vi.mock('$env/dynamic/private', () => ({ env: mocks.env }));
vi.mock('@cio/utils/plans', async () => {
  const actual = await vi.importActual<typeof import('@cio/utils/plans')>('@cio/utils/plans');

  return { ...actual, isEarlyAdopterOfferActive: mocks.isOfferActive };
});

import { PLANS } from '@cio/utils/plans';
import { GET } from './+server';

const request = (interval?: string) =>
  GET({
    url: new URL(`https://app.classroomio.com/api/polar/lock-in${interval ? `?interval=${interval}` : ''}`)
  } as Parameters<typeof GET>[0]);

describe('GET /api/polar/lock-in', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.env.POLAR_ACCESS_TOKEN = 'token';
    mocks.isOfferActive.mockReturnValue(true);
    mocks.checkoutsCreate.mockResolvedValue({ url: 'https://polar.sh/checkout/abc' });
  });

  it('creates an account-free checkout tagged for the webhook and redirects to Polar', async () => {
    const response = await request('month');

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('https://polar.sh/checkout/abc');
    expect(mocks.checkoutsCreate).toHaveBeenCalledWith({
      products: [PLANS.EARLY_ADOPTER.CTA.PRODUCT_ID],
      successUrl: 'https://classroomio.com/early-adopter/thanks',
      metadata: { kind: 'early_adopter_claim' }
    });
  });

  it('uses the yearly product for interval=year and the monthly one otherwise', async () => {
    await request('year');
    await request('weekly');

    expect(mocks.checkoutsCreate.mock.calls[0][0].products).toEqual([PLANS.EARLY_ADOPTER.CTA.PRODUCT_ID_YEARLY]);
    expect(mocks.checkoutsCreate.mock.calls[1][0].products).toEqual([PLANS.EARLY_ADOPTER.CTA.PRODUCT_ID]);
  });

  it('sends visitors to pricing without creating a checkout once the offer has ended', async () => {
    mocks.isOfferActive.mockReturnValue(false);

    const response = await request('month');

    expect(response.headers.get('location')).toBe('https://classroomio.com/pricing');
    expect(mocks.checkoutsCreate).not.toHaveBeenCalled();
  });

  it('falls back to pricing with a notice when the Polar token is missing', async () => {
    mocks.env.POLAR_ACCESS_TOKEN = undefined;

    const response = await request('month');

    expect(response.headers.get('location')).toBe('https://classroomio.com/pricing?checkout=unavailable');
    expect(mocks.checkoutsCreate).not.toHaveBeenCalled();
  });

  it('falls back to pricing with a notice when Polar rejects the checkout', async () => {
    mocks.checkoutsCreate.mockRejectedValue(new Error('Polar down'));

    const response = await request('month');

    expect(response.headers.get('location')).toBe('https://classroomio.com/pricing?checkout=unavailable');
  });
});
