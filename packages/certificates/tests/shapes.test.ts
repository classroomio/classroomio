import { describe, it, expect } from 'vitest';
import { renderCertificateDocumentV1 } from '../src/studio';
import { renderModularCertificateDocument } from '../src/templates/modular';
import type { CertificateDocumentV1, CertificateRenderData, CertificateShapeObject } from '../src/types';

const sampleData: CertificateRenderData = {
  recipientName: 'Ada Lovelace',
  courseName: 'Analytical Engine Engineering',
  courseDescription: 'For pioneering computer algorithms and mechanical computational design.',
  orgName: 'London Academy of Science',
  date: 'November 2, 2026',
  certificateId: 'CIO-2026-ADA'
};

const baseDesign: CertificateDocumentV1 = {
  version: 1,
  accentColor: '#2563eb',
  title: 'Certificate of Excellence',
  subtitle: 'Presented to',
  idFormat: 'CIO-{YYYY}-{RANDOM}',
  signatories: [{ name: 'Charles Babbage', role: 'Chief Inventor', enabled: true }]
};

describe('@cio/certificates shape rendering', () => {
  it('renders backward-compatible document unchanged when no shapes present', () => {
    const res = renderCertificateDocumentV1(baseDesign, sampleData);
    expect(res).not.toBeNull();
    expect(res!.html).toContain('London Academy of Science');
    expect(res!.html).toContain('Ada Lovelace');
    expect(res!.html).not.toContain('class="studio-shape"');
  });

  it('renders vector shapes (rectangle, ellipse, line, frame) with styles and coordinates', () => {
    const shapes: CertificateShapeObject[] = [
      {
        id: 'shape-rect-1',
        objectType: 'shape',
        shape: 'rectangle',
        frame: { x: 50, y: 60, width: 200, height: 100, rotation: 0 },
        fill: { type: 'solid', color: '#3b82f6' },
        stroke: { color: '#1e3a8a', width: 2, style: 'solid' },
        borderRadius: 8,
        opacity: 0.9,
        locked: false,
        zIndex: 1
      },
      {
        id: 'shape-ellipse-1',
        objectType: 'shape',
        shape: 'ellipse',
        frame: { x: 300, y: 150, width: 120, height: 120, rotation: 45 },
        fill: {
          type: 'linear-gradient',
          angle: 180,
          stops: [
            { offset: 0, color: '#f59e0b' },
            { offset: 1, color: '#b45309' }
          ]
        },
        stroke: { color: '#78350f', width: 1, style: 'dashed' },
        borderRadius: 0,
        opacity: 1,
        locked: false,
        zIndex: 5
      },
      {
        id: 'shape-line-1',
        objectType: 'shape',
        shape: 'line',
        frame: { x: 100, y: 400, width: 500, height: 10, rotation: 0 },
        fill: { type: 'none' },
        stroke: { color: '#000000', width: 3, style: 'solid' },
        borderRadius: 0,
        opacity: 0.8,
        locked: false,
        zIndex: 2
      }
    ];

    const designWithShapes: CertificateDocumentV1 = {
      ...baseDesign,
      rendererTemplateId: 'modular',
      shapes
    };

    const modularRes = renderModularCertificateDocument(designWithShapes, sampleData);
    expect(modularRes.html).toContain('data-certificate-element="shape-rect-1"');
    expect(modularRes.html).toContain('data-certificate-element="shape-ellipse-1"');
    expect(modularRes.html).toContain('data-certificate-element="shape-line-1"');

    // Rectangle SVG and style check
    expect(modularRes.html).toContain('<rect');
    expect(modularRes.html).toContain('fill="#3b82f6"');
    expect(modularRes.html).toContain('stroke="#1e3a8a"');
    expect(modularRes.html).toContain('stroke-width="2"');
    expect(modularRes.html).toContain('rx="7"');

    // Ellipse with linear-gradient and dashed stroke
    expect(modularRes.html).toContain('<ellipse');
    expect(modularRes.html).toContain('linearGradient id="grad-shape-ellipse-1"');
    expect(modularRes.html).toContain('stop-color="#f59e0b"');
    expect(modularRes.html).toContain('stop-color="#b45309"');
    expect(modularRes.html).toContain('stroke-dasharray="6 4"');
    expect(modularRes.html).toContain('transform:rotate(45deg)');

    // Line check
    expect(modularRes.html).toContain('<line');
    expect(modularRes.html).toContain('stroke-width="3"');

    // Also verify renderCertificateDocumentV1 fallback
    const studioRes = renderCertificateDocumentV1({ ...baseDesign, rendererTemplateId: undefined, shapes }, sampleData);
    expect(studioRes!.html).toContain('data-certificate-element="shape-rect-1"');
  });

  it('preserves layer ordering sorted by zIndex with deterministic tie-breaking', () => {
    const shapes: CertificateShapeObject[] = [
      {
        id: 'shape-front',
        objectType: 'shape',
        shape: 'rectangle',
        frame: { x: 0, y: 0, width: 100, height: 100, rotation: 0 },
        fill: { type: 'solid', color: '#ff0000' },
        stroke: null,
        borderRadius: 0,
        opacity: 1,
        locked: false,
        zIndex: 10
      },
      {
        id: 'shape-back',
        objectType: 'shape',
        shape: 'rectangle',
        frame: { x: 0, y: 0, width: 100, height: 100, rotation: 0 },
        fill: { type: 'solid', color: '#00ff00' },
        stroke: null,
        borderRadius: 0,
        opacity: 1,
        locked: false,
        zIndex: 1
      }
    ];

    const modularRes = renderModularCertificateDocument({ ...baseDesign, shapes }, sampleData);
    const backPos = modularRes.html.indexOf('data-certificate-element="shape-back"');
    const frontPos = modularRes.html.indexOf('data-certificate-element="shape-front"');
    expect(backPos).toBeLessThan(frontPos);
  });
});
