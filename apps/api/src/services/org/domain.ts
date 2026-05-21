import { AppError, ErrorCodes } from '@api/utils/errors';

import { env } from '@api/config/env';

export type DomainSetupStatus =
  | 'reconnect_required'
  | 'pending_dns'
  | 'pending_verification'
  | 'verified'
  | 'removed'
  | 'error';

export interface DomainDnsRecord {
  type: 'A' | 'CNAME' | 'TXT';
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
  provider: 'approximated';
  dnsRecords: DomainDnsRecord[];
  validationErrors: string[];
}

interface ApproximatedVhost {
  incoming_address: string;
  target_address?: string;
  dns_pointed_at?: string;
  has_ssl?: boolean;
  is_resolving?: boolean;
  apx_hit?: boolean;
  status?: string;
  ssl_active_from?: string | null;
  ssl_active_until?: string | null;
}

const SUPPORTED_CUSTOM_DOMAIN_PATTERN = /^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.){2,}[a-z]{2,63}$/i;

const APPROXIMATED_BASE_URL = 'https://cloud.approximated.app/api';

function ensureApproximatedConfig() {
  const missing = [
    ['APPROXIMATED_API_KEY', env.APPROXIMATED_API_KEY],
    ['APPROXIMATED_TARGET_ADDRESS', env.APPROXIMATED_TARGET_ADDRESS]
  ].filter(([, value]) => !value);

  if (missing.length > 0) {
    throw new AppError(
      `Missing Approximated config: ${missing.map(([key]) => key).join(', ')}`,
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

async function approximatedRequest<T>(path: string, init: RequestInit = {}): Promise<T | null> {
  ensureApproximatedConfig();

  const response = await fetch(`${APPROXIMATED_BASE_URL}${path}`, {
    ...init,
    headers: {
      'api-key': env.APPROXIMATED_API_KEY!,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init.headers ?? {})
    }
  });

  if (response.status === 404) {
    return null;
  }

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    const message =
      (payload as { message?: string } | null)?.message ??
      (payload as { error?: string } | null)?.error ??
      `Approximated ${init.method ?? 'GET'} ${path} failed`;

    throw new AppError(
      message,
      response.status === 409 ? ErrorCodes.CONFLICT : ErrorCodes.INTERNAL_ERROR,
      (response.status || 500) as 400 | 401 | 403 | 404 | 409 | 422 | 500
    );
  }

  return payload as T;
}

function buildDnsRecords(hostname: string, vhost?: ApproximatedVhost | null): DomainDnsRecord[] {
  if (!vhost?.dns_pointed_at) return [];

  return [
    {
      type: 'A',
      name: hostname,
      value: vhost.dns_pointed_at,
      status: vhost.is_resolving ? 'active' : 'pending'
    }
  ];
}

function mapDomainStatus(vhost?: ApproximatedVhost | null): DomainSetupStatus {
  if (!vhost) {
    return 'reconnect_required';
  }

  if (vhost.has_ssl && vhost.is_resolving && vhost.apx_hit) {
    return 'verified';
  }

  if (!vhost.is_resolving) {
    return 'pending_dns';
  }

  // Resolving but cert/proxy still finalizing.
  return 'pending_verification';
}

function getStatusMessage(status: DomainSetupStatus) {
  switch (status) {
    case 'reconnect_required':
      return 'Reconnect this custom domain to generate new setup records.';
    case 'pending_dns':
      return 'Add the DNS A record below, then refresh verification.';
    case 'pending_verification':
      return 'DNS resolves correctly. SSL issuance is still in progress.';
    case 'verified':
      return 'Custom domain verified.';
    case 'removed':
      return 'Custom domain removed.';
    case 'error':
    default:
      return 'Custom domain exists, but verification is not complete yet.';
  }
}

function toDomainSetupResult(hostname: string, vhost?: ApproximatedVhost | null): DomainSetupResult {
  const status = mapDomainStatus(vhost);

  return {
    hostname,
    status,
    verified: status === 'verified',
    reconnectRequired: status === 'reconnect_required',
    message: getStatusMessage(status),
    provider: 'approximated',
    dnsRecords: status === 'reconnect_required' ? [] : buildDnsRecords(hostname, vhost),
    validationErrors: []
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

  if (domain.includes('classroomio.com') || domain.includes('myclassroomio.com')) {
    throw new AppError("Domain cannot contain 'classroomio'", ErrorCodes.VALIDATION_ERROR, 400, 'domain');
  }
}

async function getVhost(hostname: string): Promise<ApproximatedVhost | null> {
  return approximatedRequest<ApproximatedVhost>(`/vhosts/by/incoming/${encodeURIComponent(hostname)}`, {
    method: 'GET'
  });
}

async function createVhost(hostname: string): Promise<ApproximatedVhost> {
  const created = await approximatedRequest<ApproximatedVhost>('/vhosts', {
    method: 'POST',
    body: JSON.stringify({
      incoming_address: hostname,
      target_address: env.APPROXIMATED_TARGET_ADDRESS!,
      target_ports: '443'
    })
  });

  if (!created) {
    throw new AppError('Approximated did not return a vhost', ErrorCodes.INTERNAL_ERROR, 500);
  }
  return created;
}

export async function connectDomain(hostname: string): Promise<DomainSetupResult> {
  const existing = await getVhost(hostname);
  const vhost = existing ?? (await createVhost(hostname));
  return toDomainSetupResult(hostname, vhost);
}

export async function refreshDomain(hostname: string): Promise<DomainSetupResult> {
  const vhost = await getVhost(hostname);
  return toDomainSetupResult(hostname, vhost);
}

export async function removeDomain(hostname: string): Promise<DomainSetupResult> {
  await approximatedRequest<null>(`/vhosts/by/incoming/${encodeURIComponent(hostname)}`, {
    method: 'DELETE'
  });

  return {
    hostname,
    status: 'removed',
    verified: false,
    reconnectRequired: false,
    message: getStatusMessage('removed'),
    provider: 'approximated',
    dnsRecords: [],
    validationErrors: []
  };
}
