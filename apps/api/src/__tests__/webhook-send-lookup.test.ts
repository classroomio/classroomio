import http from 'node:http';
import type { AddressInfo } from 'node:net';

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.PRIVATE_SERVER_KEY = 'unit-test-server-key';
});

import { createPinnedLookup } from '@cio/core/services/webhook/send';

let server: http.Server;
let port: number;

beforeAll(async () => {
  server = http.createServer((_request, response) => response.end('ok'));
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  port = (server.address() as AddressInfo).port;
});

afterAll(() => {
  server.close();
});

function post(host: string): Promise<number | undefined> {
  return new Promise((resolve, reject) => {
    const request = http.request(
      { host, port, method: 'POST', lookup: createPinnedLookup({ address: '127.0.0.1', family: 4 }) },
      (response) => {
        response.resume();
        resolve(response.statusCode);
      }
    );

    request.on('error', reject);
    request.end('body');
  });
}

describe('createPinnedLookup', () => {
  it('answers a single-address lookup', () => {
    const callback = vi.fn();

    createPinnedLookup({ address: '203.0.113.7', family: 4 })('hooks.example.com', {}, callback);

    expect(callback).toHaveBeenCalledWith(null, '203.0.113.7', 4);
  });

  it('answers the address-list lookup Node makes by default', () => {
    const callback = vi.fn();

    createPinnedLookup({ address: '203.0.113.7', family: 4 })('hooks.example.com', { all: true }, callback);

    expect(callback).toHaveBeenCalledWith(null, [{ address: '203.0.113.7', family: 4 }]);
  });

  it('lets a request to a real hostname connect to the pinned address', async () => {
    await expect(post('localhost')).resolves.toBe(200);
  });
});
