import { describe, expect, it } from 'vitest';
import { isLocalOrPrivateHost } from '../src/functions/network';

describe('isLocalOrPrivateHost', () => {
  it('identifies loopback and local hostnames', () => {
    expect(isLocalOrPrivateHost('localhost')).toBe(true);
    expect(isLocalOrPrivateHost('localhost:5173')).toBe(true);
    expect(isLocalOrPrivateHost('127.0.0.1')).toBe(true);
    expect(isLocalOrPrivateHost('127.0.0.1:3002')).toBe(true);
    expect(isLocalOrPrivateHost('127.0.1.1')).toBe(true);
    expect(isLocalOrPrivateHost('0.0.0.0')).toBe(true);
    expect(isLocalOrPrivateHost('0.0.0.0:5173')).toBe(true);
    expect(isLocalOrPrivateHost('::1')).toBe(true);
    expect(isLocalOrPrivateHost('[::1]')).toBe(true);
    expect(isLocalOrPrivateHost('macbook.local')).toBe(true);
    expect(isLocalOrPrivateHost('my-phone.local:5173')).toBe(true);
  });

  it('identifies RFC 1918 private IPv4 addresses', () => {
    // 192.168.0.0/16
    expect(isLocalOrPrivateHost('192.168.1.163')).toBe(true);
    expect(isLocalOrPrivateHost('192.168.1.163:5173')).toBe(true);
    expect(isLocalOrPrivateHost('192.168.0.1')).toBe(true);
    expect(isLocalOrPrivateHost('192.168.255.255')).toBe(true);

    // 10.0.0.0/8
    expect(isLocalOrPrivateHost('10.0.0.1')).toBe(true);
    expect(isLocalOrPrivateHost('10.100.50.1:3000')).toBe(true);
    expect(isLocalOrPrivateHost('10.255.255.255')).toBe(true);

    // 172.16.0.0/12 (172.16.x.x - 172.31.x.x)
    expect(isLocalOrPrivateHost('172.16.0.1')).toBe(true);
    expect(isLocalOrPrivateHost('172.20.10.2:5173')).toBe(true);
    expect(isLocalOrPrivateHost('172.31.255.255')).toBe(true);
    expect(isLocalOrPrivateHost('172.15.0.1')).toBe(false);
    expect(isLocalOrPrivateHost('172.32.0.1')).toBe(false);

    // 169.254.0.0/16 (link-local)
    expect(isLocalOrPrivateHost('169.254.1.1')).toBe(true);
  });

  it('rejects public hostnames and external domains', () => {
    expect(isLocalOrPrivateHost('classroomio.com')).toBe(false);
    expect(isLocalOrPrivateHost('app.classroomio.com')).toBe(false);
    expect(isLocalOrPrivateHost('api.classroomio.com:3002')).toBe(false);
    expect(isLocalOrPrivateHost('myclassroomio.com')).toBe(false);
    expect(isLocalOrPrivateHost('customdomain.com')).toBe(false);
    expect(isLocalOrPrivateHost('8.8.8.8')).toBe(false);
    expect(isLocalOrPrivateHost('1.1.1.1')).toBe(false);
    expect(isLocalOrPrivateHost('')).toBe(false);
  });
});
