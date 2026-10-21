export const PACKAGE_ERROR_CODES = [
  'missing_manifest',
  'invalid_xml',
  'doctype_rejected',
  'unsupported_version',
  'xapi_package',
  'cmi5_package',
  'external_launch',
  'assets_only',
  'missing_launch',
  'unsafe_path',
  'too_many_entries',
  'total_too_large',
  'compression_bomb',
  'symlink_rejected',
  'encrypted_entry',
  'upload_missing',
  'file_too_large',
  'not_a_zip',
  'invalid_commit',
  'invalid_token',
  'expired_token'
] as const;

export type PackageErrorCode = (typeof PACKAGE_ERROR_CODES)[number];

export class PackageError extends Error {
  readonly code: PackageErrorCode;
  readonly details: Record<string, unknown>;

  constructor(code: PackageErrorCode, details: Record<string, unknown> = {}) {
    super(code);
    this.name = 'PackageError';
    this.code = code;
    this.details = details;
  }
}
