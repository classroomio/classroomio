import { describe, expect, it } from 'vitest';
import {
  LESSON_DOCUMENT_ACCEPTED_TYPES,
  getFileUploadAcceptAttribute,
  getFileUploadTypeKeyForMimeType,
  isFileTypeAllowed,
  normalizeAcceptedFileTypes,
  resolveFileUploadMimeType,
  resolveFileUploadTypeKey
} from '../src/file-upload';

describe('file upload types', () => {
  it('normalizes CSV and Jupyter aliases', () => {
    expect(normalizeAcceptedFileTypes(['.csv', 'application/csv', '.ipynb', 'application/json'])).toEqual([
      'text/csv',
      'application/x-ipynb+json'
    ]);
  });

  it('accepts CSV by MIME type or extension-only browser metadata', () => {
    const acceptedTypes = ['text/csv'];

    expect(isFileTypeAllowed({ name: 'results.csv', type: 'text/csv' }, acceptedTypes)).toBe(true);
    expect(isFileTypeAllowed({ name: 'results.csv', type: '' }, acceptedTypes)).toBe(true);
    expect(isFileTypeAllowed({ name: 'results', type: 'application/csv' }, acceptedTypes)).toBe(true);
    expect(isFileTypeAllowed({ name: 'results.csv', type: 'application/vnd.ms-excel' }, acceptedTypes)).toBe(true);
  });

  it('accepts Jupyter notebooks with their standard or browser JSON MIME type', () => {
    const acceptedTypes = ['application/x-ipynb+json'];

    expect(isFileTypeAllowed({ name: 'analysis.ipynb', type: 'application/x-ipynb+json' }, acceptedTypes)).toBe(true);
    expect(isFileTypeAllowed({ name: 'analysis.ipynb', type: 'application/json' }, acceptedTypes)).toBe(true);
    expect(isFileTypeAllowed({ name: 'analysis.ipynb', type: '' }, acceptedTypes)).toBe(true);
  });

  it('rejects generic JSON and conflicting filename extensions', () => {
    expect(isFileTypeAllowed({ name: 'data.json', type: 'application/json' }, [])).toBe(false);
    expect(isFileTypeAllowed({ name: 'payload.csv', type: 'application/x-msdownload' }, [])).toBe(false);
    expect(isFileTypeAllowed({ name: 'payload.exe', type: 'text/csv' }, [])).toBe(false);
    expect(isFileTypeAllowed({ name: 'workbook.xls', type: 'application/vnd.ms-excel' }, [])).toBe(false);
  });

  it('enforces question-scoped accepted types when provided', () => {
    const csvOnly = ['text/csv'];

    expect(isFileTypeAllowed({ name: 'results.csv', type: 'text/csv' }, csvOnly)).toBe(true);
    expect(isFileTypeAllowed({ name: 'notes.pdf', type: 'application/pdf' }, csvOnly)).toBe(false);
  });

  it('includes MIME types and extensions in the browser accept value', () => {
    const value = getFileUploadAcceptAttribute(['text/csv', 'application/x-ipynb+json']);

    expect(value.split(',')).toEqual(['text/csv', '.csv', 'application/csv', 'application/x-ipynb+json', '.ipynb']);
  });

  it('accepts Excel workbooks and Python scripts by MIME type or extension-only browser metadata', () => {
    const xlsxMime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    expect(isFileTypeAllowed({ name: 'sales.xlsx', type: xlsxMime }, [])).toBe(true);
    expect(isFileTypeAllowed({ name: 'sales.xlsx', type: '' }, [])).toBe(true);
    expect(isFileTypeAllowed({ name: 'clean.py', type: 'text/x-python' }, [])).toBe(true);
    expect(isFileTypeAllowed({ name: 'clean.py', type: 'text/x-python-script' }, [])).toBe(true);
    expect(isFileTypeAllowed({ name: 'clean.py', type: 'text/plain' }, [])).toBe(true);
    expect(isFileTypeAllowed({ name: 'notes.txt', type: 'text/plain' }, [])).toBe(false);
    expect(isFileTypeAllowed({ name: 'clean.py', type: '' }, [])).toBe(true);
    expect(isFileTypeAllowed({ name: 'clean.py', type: 'application/octet-stream' }, [])).toBe(true);
    expect(isFileTypeAllowed({ name: 'clean.sh', type: 'text/x-python' }, [])).toBe(false);
  });

  it('resolves the canonical MIME type and type key for lesson documents', () => {
    const lessonTypes = LESSON_DOCUMENT_ACCEPTED_TYPES;

    expect(resolveFileUploadMimeType({ name: 'clean.py', type: '' }, lessonTypes)).toBe('text/x-python');
    expect(resolveFileUploadMimeType({ name: 'analysis.ipynb', type: 'application/json' }, lessonTypes)).toBe(
      'application/x-ipynb+json'
    );
    expect(resolveFileUploadTypeKey({ name: 'data.csv', type: 'text/csv' }, lessonTypes)).toBe('csv');
    expect(resolveFileUploadTypeKey({ name: 'brief.pdf', type: 'application/pdf' }, lessonTypes)).toBe('pdf');
    expect(resolveFileUploadMimeType({ name: 'clip.mp4', type: 'video/mp4' }, lessonTypes)).toBeNull();
    expect(getFileUploadTypeKeyForMimeType('text/x-python')).toBe('py');
    expect(getFileUploadTypeKeyForMimeType('application/zip')).toBeNull();
  });
});
