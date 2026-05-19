import { env } from '@api/config/env';
import { AppError, ErrorCodes } from '@api/utils/errors';

export type DomainSetupStatus =
  | 'reconnect_required'
  | 'pending_dns'
  | 'pending_verification'
  | 'verified'
  | 'removed'
  | 'error';

export interface DomainDnsRecord {
  type: 'CNAME' | 'TXT';
  name: string;
  value: string;
  status: 'pending' | 'active';
}

export interface DomainSetupResult {
  hostname: string;
  status: DomainSetupStatus;
  verified: boolean;
  reconnectRequired: boolean;
  message: string;
  provider: 'cloudflare';
  dnsRecords: DomainDnsRecord[];
}

interface CloudflareApiError {
  code: number;
  message: string;
}

interface CloudflareEnvelope<T> {
  success: boolean;
  errors: CloudflareApiError[];
  messages: Array<{ code: number; message: string }>;
  result: T;
}

interface CloudflareValidationRecord {
  status?: string;
  txt_name?: string;
  txt_value?: string;
}

interface CloudflareCustomHostname {
  id: string;
  hostname: string;
  status?: string;
  ownership_verification?: {
    type?: string;
    name?: string;
    value?: string;
  };
  ssl?: {
    status?: string;
    validation_records?: CloudflareValidationRecord[];
  };
}

const SUPPORTED_CUSTOM_DOMAIN_PATTERN = /^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.){2,}[a-z]{2,63}$/i;

function ensureCloudflareConfig() {
  const missing = [
    ['CLOUDFLARE_CUSTOM_HOSTNAMES_API_TOKEN', env.CLOUDFLARE_CUSTOM_HOSTNAMES_API_TOKEN],
    ['CLOUDFLARE_CUSTOM_HOSTNAMES_ZONE_ID', env.CLOUDFLARE_CUSTOM_HOSTNAMES_ZONE_ID],
    ['CLOUDFLARE_CUSTOM_HOSTNAME_CNAME_TARGET', env.CLOUDFLARE_CUSTOM_HOSTNAME_CNAME_TARGET]
  ].filter(([, value]) => !value);

  if (missing.length > 0) {
    throw new AppError(
      `Missing Cloudflare custom domain config: ${missing.map(([key]) => key).join(', ')}`,
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

function getCloudflareBasePath() {
  ensureCloudflareConfig();
  return `https://api.cloudflare.com/client/v4/zones/${env.CLOUDFLARE_CUSTOM_HOSTNAMES_ZONE_ID}/custom_hostnames`;
}

async function cloudflareRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${getCloudflareBasePath()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.CLOUDFLARE_CUSTOM_HOSTNAMES_API_TOKEN}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {})
    }
  });

  const payload = (await response.json()) as CloudflareEnvelope<T>;

  if (!response.ok || !payload.success) {
    const message =
      payload.errors?.map((error) => error.message).join(', ') ||
      payload.messages?.map((item) => item.message).join(', ') ||
      'Cloudflare domain request failed';

    throw new AppError(
      message,
      response.status === 409 ? ErrorCodes.CONFLICT : ErrorCodes.INTERNAL_ERROR,
      (response.status || 500) as 400 | 401 | 403 | 404 | 409 | 422 | 500
    );
  }

  return payload.result;
}

function dedupeDnsRecords(records: DomainDnsRecord[]) {
  const seen = new Set<string>();

  return records.filter((record) => {
    const key = `${record.type}:${record.name}:${record.value}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function buildDnsRecords(hostname: string, customHostname?: CloudflareCustomHostname | null): DomainDnsRecord[] {
  const records: DomainDnsRecord[] = [
    {
      type: 'CNAME',
      name: hostname,
      value: env.CLOUDFLARE_CUSTOM_HOSTNAME_CNAME_TARGET!,
      status: customHostname?.status === 'active' ? 'active' : 'pending'
    }
  ];

  if (customHostname?.ownership_verification?.name && customHostname?.ownership_verification?.value) {
    records.push({
      type: 'TXT',
      name: customHostname.ownership_verification.name,
      value: customHostname.ownership_verification.value,
      status: customHostname.status === 'active' ? 'active' : 'pending'
    });
  }

  customHostname?.ssl?.validation_records?.forEach((record) => {
    if (!record.txt_name || !record.txt_value) {
      return;
    }

    records.push({
      type: 'TXT',
      name: record.txt_name,
      value: record.txt_value,
      status: record.status === 'active' ? 'active' : 'pending'
    });
  });

  return dedupeDnsRecords(records);
}

function mapDomainStatus(customHostname?: CloudflareCustomHostname | null): DomainSetupStatus {
  if (!customHostname) {
    return 'reconnect_required';
  }

  if (customHostname.status === 'active' || customHostname.ssl?.status === 'active') {
    return 'verified';
  }

  const hasOwnershipRecord = Boolean(
    customHostname.ownership_verification?.name && customHostname.ownership_verification?.value
  );

  if (hasOwnershipRecord) {
    return 'pending_dns';
  }

  const hasSslValidationRecords = Boolean(
    customHostname.ssl?.validation_records?.some((record) => record.txt_name && record.txt_value)
  );

  if (hasSslValidationRecords || customHostname.ssl?.status) {
    return 'pending_verification';
  }

  return 'error';
}

function getStatusMessage(status: DomainSetupStatus) {
  switch (status) {
    case 'reconnect_required':
      return 'Reconnect this custom domain to generate new Cloudflare setup records.';
    case 'pending_dns':
      return 'Add the DNS records below, then refresh verification.';
    case 'pending_verification':
      return 'DNS records were found. SSL issuance or validation is still in progress.';
    case 'verified':
      return 'Custom domain verified.';
    case 'removed':
      return 'Custom domain removed.';
    case 'error':
    default:
      return 'Custom domain exists, but verification is not complete yet.';
  }
}

function toDomainSetupResult(hostname: string, customHostname?: CloudflareCustomHostname | null): DomainSetupResult {
  const status = mapDomainStatus(customHostname);

  return {
    hostname,
    status,
    verified: status === 'verified',
    reconnectRequired: status === 'reconnect_required',
    message: getStatusMessage(status),
    provider: 'cloudflare',
    dnsRecords: status === 'reconnect_required' ? [] : buildDnsRecords(hostname, customHostname)
  };
}

export function normalizeCustomDomain(domain: string) {
  return domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, '')
    .split('/')[0]
    .replace(/\.$/, '');
}

export function assertSupportedCustomDomain(domain: string) {
  if (!SUPPORTED_CUSTOM_DOMAIN_PATTERN.test(domain)) {
    throw new AppError(
      'Only custom subdomains are supported. Use a subdomain like courses.yourwebsite.com.',
      ErrorCodes.VALIDATION_ERROR,
      400,
      'domain'
    );
  }

  if (domain.includes('classroomio.com') || domain.includes('classroomio.school')) {
    throw new AppError("Domain cannot contain 'classroomio'", ErrorCodes.VALIDATION_ERROR, 400, 'domain');
  }
}

async function getCustomHostnameByDomain(hostname: string) {
  const results = await cloudflareRequest<CloudflareCustomHostname[]>(`?hostname=${encodeURIComponent(hostname)}`, {
    method: 'GET'
  });

  return results.find((result) => result.hostname.toLowerCase() === hostname.toLowerCase()) ?? null;
}

async function createCustomHostname(hostname: string) {
  return cloudflareRequest<CloudflareCustomHostname>('', {
    method: 'POST',
    body: JSON.stringify({
      hostname,
      ssl: {
        method: 'txt',
        type: 'dv'
      }
    })
  });
}

async function revalidateCustomHostname(customHostname: CloudflareCustomHostname) {
  return cloudflareRequest<CloudflareCustomHostname>(`/${customHostname.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      ssl: {
        method: 'txt',
        type: 'dv'
      }
    })
  });
}

export async function connectDomain(hostname: string): Promise<DomainSetupResult> {
  const existing = await getCustomHostnameByDomain(hostname);
  const customHostname = existing ?? (await createCustomHostname(hostname));

  return toDomainSetupResult(hostname, customHostname);
}

export async function refreshDomain(hostname: string): Promise<DomainSetupResult> {
  const existing = await getCustomHostnameByDomain(hostname);

  if (!existing) {
    return toDomainSetupResult(hostname, null);
  }

  if (existing.status === 'active' || existing.ssl?.status === 'active') {
    return toDomainSetupResult(hostname, existing);
  }

  const refreshed = await revalidateCustomHostname(existing);
  return toDomainSetupResult(hostname, refreshed);
}

export async function removeDomain(hostname: string): Promise<DomainSetupResult> {
  const existing = await getCustomHostnameByDomain(hostname);

  if (existing) {
    await cloudflareRequest<null>(`/${existing.id}`, {
      method: 'DELETE'
    });
  }

  return {
    hostname,
    status: 'removed',
    verified: false,
    reconnectRequired: false,
    message: getStatusMessage('removed'),
    provider: 'cloudflare',
    dnsRecords: []
  };
}
