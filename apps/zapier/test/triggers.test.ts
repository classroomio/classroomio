import { createHmac } from 'node:crypto';

import nock from 'nock';
import { createAppTester } from 'zapier-platform-core';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { WEBHOOK_EVENT_DATA_EXAMPLES, ZWebhookEventData } from '@cio/utils/validation/webhook';
import { ZAPIER_TRIGGERS } from '@cio/utils/constants/zapier';

import App from '../src/index';

const API_ORIGIN = 'https://api.example.test';
const SECRET = `whsec_${Buffer.from('test-secret-test-secret!').toString('base64')}`;
const appTester = createAppTester(App);

beforeAll(() => {
  process.env.CIO_API_ORIGIN = API_ORIGIN;
  process.env.CIO_APP_ORIGIN = 'https://app.example.test';
});

afterEach(() => nock.cleanAll());

function signedDelivery(body: string, timestamp = Math.floor(Date.now() / 1000)) {
  const id = 'evt_test';
  const key = Buffer.from(SECRET.slice('whsec_'.length), 'base64');
  const signature = createHmac('sha256', key).update(`${id}.${timestamp}.${body}`).digest('base64');

  return {
    headers: { 'webhook-id': id, 'webhook-timestamp': String(timestamp), 'webhook-signature': `v1,${signature}` },
    content: body
  };
}

describe('dropdown triggers', () => {
  it('paginates lessons beyond the first 20', async () => {
    const scope = nock(API_ORIGIN)
      .get('/public-api/v1/courses/course-1/lessons')
      .query({ page: '2', limit: '100' })
      .reply(200, {
        success: true,
        data: [{ id: 'lesson-21', title: 'Lesson 21' }]
      });

    const perform = (App.triggers.lesson_list.operation as any).perform;
    const result = await appTester(perform, {
      inputData: { courseId: 'course-1' },
      meta: { page: 1 }
    });

    expect(result).toEqual([{ id: 'lesson-21', title: 'Lesson 21' }]);
    expect(scope.isDone()).toBe(true);
  });

  it('loads every invite page before filtering out inactive invites', async () => {
    nock(API_ORIGIN)
      .get('/public-api/v1/courses/course-1/invites')
      .query({ page: '1', limit: '100' })
      .reply(200, {
        success: true,
        data: [{ id: 'invite-revoked', status: 'revoked', allowedEmails: null }],
        pagination: { page: 1, limit: 100, total: 2, totalPages: 2 }
      });
    nock(API_ORIGIN)
      .get('/public-api/v1/courses/course-1/invites')
      .query({ page: '2', limit: '100' })
      .reply(200, {
        success: true,
        data: [{ id: 'invite-active', status: 'active', allowedEmails: ['student@example.com'] }],
        pagination: { page: 2, limit: 100, total: 2, totalPages: 2 }
      });

    const perform = (App.triggers.course_invite_list.operation as any).perform;
    const result = await appTester(perform, {
      inputData: { courseId: 'course-1' }
    });

    expect(result).toEqual([{ id: 'invite-active', label: 'student@example.com' }]);
  });
});

describe('event triggers', () => {
  it('subscribes with the target URL, event type and course filter', async () => {
    const scope = nock(API_ORIGIN)
      .post('/public-api/v1/webhooks/subscriptions', {
        targetUrl: 'https://hooks.zapier.com/x',
        eventType: 'course.member.added',
        courseId: 'course-1'
      })
      .reply(201, { success: true, data: { id: 'sub-1', secret: SECRET } });

    const performSubscribe = (App.triggers.new_course_enrollment.operation as any).performSubscribe;
    const result = await appTester(performSubscribe, {
      authData: { access_token: 'token' },
      targetUrl: 'https://hooks.zapier.com/x',
      inputData: { courseId: 'course-1' }
    });

    expect(result).toEqual({ id: 'sub-1', secret: SECRET });
    expect(scope.isDone()).toBe(true);
  });

  it('treats an already deleted subscription as unsubscribed', async () => {
    nock(API_ORIGIN).delete('/public-api/v1/webhooks/subscriptions/sub-1').reply(404, { success: false });

    const performUnsubscribe = (App.triggers.new_course_enrollment.operation as any).performUnsubscribe;
    await expect(
      appTester(performUnsubscribe, {
        authData: { access_token: 'token' },
        subscribeData: { id: 'sub-1', secret: SECRET } as any
      })
    ).resolves.toEqual({});
  });

  it('uses the shared error handler when unsubscribe fails', async () => {
    nock(API_ORIGIN).delete('/public-api/v1/webhooks/subscriptions/sub-1').reply(403, {
      success: false,
      code: 'UPGRADE_REQUIRED'
    });

    const performUnsubscribe = (App.triggers.new_course_enrollment.operation as any).performUnsubscribe;
    await expect(
      appTester(performUnsubscribe, {
        authData: { access_token: 'token' },
        subscribeData: { id: 'sub-1', secret: SECRET } as any
      })
    ).rejects.toThrow("plan doesn't include Zapier");
  });

  it('falls back to the static sample when every returned sample is filtered out', async () => {
    const envelope = {
      id: 'evt_filtered',
      type: 'course.member.added',
      createdAt: '2026-10-30T00:00:00.000Z',
      apiVersion: '2026-10-21',
      organization: { id: 'org-1', name: 'Acme', siteName: 'acme' },
      data: WEBHOOK_EVENT_DATA_EXAMPLES['course.member.added']
    };

    nock(API_ORIGIN)
      .get('/public-api/v1/webhooks/samples')
      .query({ eventType: 'course.member.added' })
      .reply(200, { success: true, data: [envelope] });

    const performList = (App.triggers.new_course_enrollment.operation as any).performList;
    const result = (await appTester(performList, {
      authData: { access_token: 'token' },
      inputData: { source: ['admin'] }
    })) as any[];

    expect(result).toEqual([(App.triggers.new_course_enrollment.operation as any).sample]);
  });

  it('skips the certificate download for documented examples', async () => {
    const example = {
      id: 'evt_example_course_certificate_issued',
      type: 'course.certificate.issued',
      createdAt: '2026-10-13T12:15:30.000Z',
      apiVersion: '2026-10-21',
      organization: { id: 'org-1', name: 'Acme', siteName: 'acme' },
      data: WEBHOOK_EVENT_DATA_EXAMPLES['course.certificate.issued']
    };

    nock(API_ORIGIN)
      .get('/public-api/v1/webhooks/samples')
      .query({ eventType: 'course.certificate.issued' })
      .reply(200, { success: true, data: [example] });

    const performList = (App.triggers.new_certificate.operation as any).performList;
    const result = (await appTester(performList, {
      authData: { access_token: 'token' },
      inputData: {}
    })) as any[];

    expect(result).toHaveLength(1);
    expect(result[0]).not.toHaveProperty('certificate_file');
  });

  it('attaches a certificate download for real events', async () => {
    const envelope = {
      id: 'evt_01J9Z8X7Y6W5V4U3T2S1',
      type: 'course.certificate.issued',
      createdAt: '2026-10-13T12:15:30.000Z',
      apiVersion: '2026-10-21',
      organization: { id: 'org-1', name: 'Acme', siteName: 'acme' },
      data: WEBHOOK_EVENT_DATA_EXAMPLES['course.certificate.issued']
    };

    nock(API_ORIGIN)
      .get('/public-api/v1/webhooks/samples')
      .query({ eventType: 'course.certificate.issued' })
      .reply(200, { success: true, data: [envelope] });

    const performList = (App.triggers.new_certificate.operation as any).performList;
    const result = (await appTester(performList, {
      authData: { access_token: 'token' },
      inputData: {}
    })) as any[];

    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('certificate_file');
  });

  it('returns a signed delivery and drops a forged one', async () => {
    const envelope = {
      id: 'evt_test',
      type: 'course.member.added',
      createdAt: '2026-10-30T00:00:00.000Z',
      apiVersion: '2026-10-21',
      organization: { id: 'org-1', name: 'Acme', siteName: 'acme' },
      data: WEBHOOK_EVENT_DATA_EXAMPLES['course.member.added']
    };
    const body = JSON.stringify(envelope);
    const perform = (App.triggers.new_course_enrollment.operation as any).perform;

    const accepted = (await appTester(perform, {
      cleanedRequest: envelope,
      rawRequest: signedDelivery(body),
      subscribeData: { id: 'sub-1', secret: SECRET } as any,
      inputData: {}
    })) as any[];
    const forged = (await appTester(perform, {
      cleanedRequest: envelope,
      rawRequest: { ...signedDelivery(body), content: body.replace('Alex', 'Eve') },
      subscribeData: { id: 'sub-1', secret: SECRET } as any,
      inputData: {}
    })) as any[];

    expect(accepted).toHaveLength(1);
    expect(accepted[0]).toMatchObject({ id: 'evt_test', event_type: 'course.member.added' });
    expect(forged).toEqual([]);
  });

  it.each(ZAPIER_TRIGGERS.map((trigger) => [trigger.key, trigger.eventType] as const))(
    '%s ships a sample that matches the %s schema',
    (key, eventType) => {
      const { id, event_type, occurred_at, organization, ...data } = (App.triggers as any)[key].operation.sample;

      expect(() => ZWebhookEventData[eventType].parse(data)).not.toThrow();
    }
  );
});
