import React from 'react';
import { Ic, useInteract, FONT } from './uiShared.jsx';

export const BYTE = 1;
export const KILOBYTE = 1000;
export const MEGABYTE = 1000 * KILOBYTE;
export const GIGABYTE = 1000 * MEGABYTE;
export const ACCEPT_IMAGE = 'image/*';
export const ACCEPT_VIDEO = 'video/*';
export const ACCEPT_AUDIO = 'audio/*';

export function displaySize(bytes) {
  if (bytes < KILOBYTE) return `${bytes.toFixed(0)} B`;
  if (bytes < MEGABYTE) return `${(bytes / KILOBYTE).toFixed(0)} KB`;
  if (bytes < GIGABYTE) return `${(bytes / MEGABYTE).toFixed(0)} MB`;
  return `${(bytes / GIGABYTE).toFixed(0)} GB`;
}

function rejectionFor(file, fileNumber, { maxFileSize, maxFiles, accept }) {
  if (maxFileSize !== undefined && file.size > maxFileSize) return 'Maximum file size exceeded';
  if (maxFiles !== undefined && fileNumber > maxFiles) return 'Maximum files uploaded';
  if (!accept) return undefined;
  const types = accept.split(',').map((a) => a.trim().toLowerCase());
  const type = (file.type || '').toLowerCase();
  const name = file.name.toLowerCase();
  const ok = types.some((p) => {
    if (type === '' || p.startsWith('.')) return name.endsWith(p);
    if (p.endsWith('/*')) return type.startsWith(p.slice(0, p.indexOf('/*')) + '/');
    return type === p;
  });
  return ok ? undefined : 'File type not allowed';
}

export function FileDropZone({
  id, onUpload, onFileRejected, maxFiles, fileCount, maxFileSize, accept, disabled = false,
  label = "Drag 'n' drop files here, or click to select files",
  formatMaxFiles = (count) => `You can upload ${count} files`,
  formatMaxFilesAndSize = (size) => `(up to ${size} each)`,
  formatMaxSize = (size) => `Maximum size ${size}`,
  children, style,
}) {
  const uid = React.useId();
  const inputId = id || uid;
  const [uploading, setUploading] = React.useState(false);
  const { hover, focus, bind } = useInteract();
  const canUpload = !disabled && !uploading && !(maxFiles !== undefined && fileCount !== undefined && fileCount >= maxFiles);
  const multiple = maxFiles === undefined || maxFiles - (fileCount ?? 0) > 1;

  const upload = async (files) => {
    setUploading(true);
    const valid = [];
    files.forEach((file, i) => {
      const reason = rejectionFor(file, (fileCount ?? 0) + i + 1, { maxFileSize, maxFiles, accept });
      if (reason) onFileRejected && onFileRejected({ file, reason });
      else valid.push(file);
    });
    try { onUpload && await onUpload(valid); } finally { setUploading(false); }
  };

  const onDrop = (e) => {
    if (!canUpload) return;
    e.preventDefault();
    upload(Array.from(e.dataTransfer.files || []));
  };
  const onChange = (e) => {
    if (!canUpload) return;
    const files = Array.from(e.target.files || []);
    upload(files);
    e.target.value = '';
  };

  const active = hover && canUpload;
  const limits = maxFiles || maxFileSize;

  return <>
    <input id={inputId} type="file" accept={accept} multiple={multiple} disabled={!canUpload} onChange={onChange} style={{ display: 'none' }} />
    <label htmlFor={inputId} aria-disabled={!canUpload} onDragOver={(e) => e.preventDefault()} onDrop={onDrop} {...bind} style={{ display: 'block', fontFamily: FONT, ...style }}>
      {children || <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, height: 192, padding: 24, boxSizing: 'border-box', borderRadius: 'var(--ui-radius-lg)', border: '1px dashed var(--ui-border)', background: active ? 'color-mix(in oklab, var(--ui-accent) 25%, transparent)' : 'transparent', opacity: canUpload ? 1 : 0.5, cursor: canUpload ? 'pointer' : 'not-allowed', transition: 'all 150ms' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: 999, border: '1px dashed var(--ui-border)', color: 'var(--ui-muted-foreground)' }}>{Ic('upload', 28)}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'center' }}>
          <span style={{ fontSize: 16, color: 'var(--ui-muted-foreground)' }}>{label}</span>
          {limits && <span style={{ fontSize: 14, color: 'color-mix(in oklab, var(--ui-muted-foreground) 75%, transparent)' }}>
            {maxFiles && <span>{formatMaxFiles(maxFiles)} </span>}
            {maxFiles && maxFileSize && <span>{formatMaxFilesAndSize(displaySize(maxFileSize))}</span>}
            {maxFileSize && !maxFiles && <span>{formatMaxSize(displaySize(maxFileSize))}</span>}
          </span>}
        </div>
      </div>}
    </label>
  </>;
}
