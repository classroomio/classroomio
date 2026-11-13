export type EventEnvelope = {
  id: string;
  type: string;
  createdAt: string;
  apiVersion: string;
  organization: { id: string; name: string | null; siteName: string | null };
  data: Record<string, unknown>;
};

export type EventRecord = Record<string, unknown> & { id: string };

export function toEventRecord(envelope: EventEnvelope): EventRecord {
  return {
    ...envelope.data,
    id: envelope.id,
    event_type: envelope.type,
    occurred_at: envelope.createdAt,
    organization: envelope.organization
  };
}

export function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function readStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string' && item.length > 0);

  const single = readString(value);

  return single ? [single] : [];
}
