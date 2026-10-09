import { describe, expect, it } from 'vitest';
import { getFileUploadAcceptAttribute, isFileTypeAllowed, normalizeAcceptedFileTypes } from '../src/file-upload';

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

  it('includes MIME types and extensions in the browser accept value', () => {
    const value = getFileUploadAcceptAttribute(['text/csv', 'application/x-ipynb+json']);

    expect(value.split(',')).toEqual(['text/csv', '.csv', 'application/csv', 'application/x-ipynb+json', '.ipynb']);
  });
});
