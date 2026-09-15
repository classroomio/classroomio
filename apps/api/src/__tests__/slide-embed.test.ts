import { describe, expect, it } from 'vitest';
import {
  createSlideEmbed,
  extractIframeSrc,
  isAllowedSlideEmbedSrc,
  parseSlideEmbed,
  resolveLessonSlides
} from '@cio/utils/functions';

describe('slide embed parsing', () => {
  it('extracts src from a full iframe and ignores width and height', () => {
    const raw =
      '<iframe src="https://docs.google.com/presentation/d/e/2PACX-abc/embed" width="320" height="200"></iframe>';

    expect(extractIframeSrc(raw)).toBe('https://docs.google.com/presentation/d/e/2PACX-abc/embed');
  });

  it('normalizes a Google Slides publish link into the embed src', () => {
    const parsed = parseSlideEmbed(
      '<iframe src="https://docs.google.com/presentation/d/e/2PACX-abc/pub?start=false"></iframe>'
    );

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(parsed.platform).toBe('google-slides');
    expect(parsed.src).toContain('/embed');
    expect(parsed.src).not.toContain('/pub');
  });

  it('appends Canva embed query and drops pasted dimensions from storage', () => {
    const created = createSlideEmbed(
      '<iframe src="https://www.canva.com/design/DAFDemo/view" width="1200" height="800"></iframe>',
      'slide-1'
    );

    expect(created).toEqual({
      id: 'slide-1',
      platform: 'canva',
      src: 'https://www.canva.com/design/DAFDemo/view?embed'
    });
  });

  it('rejects an unsupported host', () => {
    const parsed = parseSlideEmbed('<iframe src="https://example.com/deck"></iframe>');

    expect(parsed).toEqual({ ok: false, reason: 'unsupported' });
    expect(isAllowedSlideEmbedSrc('https://example.com/deck')).toBe(false);
  });

  it('hydrates a legacy slideUrl when slides is empty', () => {
    const slides = resolveLessonSlides([], 'https://www.canva.com/design/DAFLegacy/view');

    expect(slides).toHaveLength(1);
    expect(slides[0]?.platform).toBe('canva');
    expect(slides[0]?.src).toContain('embed');
  });

  it('accepts Figma, Pitch, and PowerPoint iframe src hosts', () => {
    const figma = parseSlideEmbed(
      '<iframe src="https://embed.figma.com/slides/DemoFileKey123" width="800" height="450"></iframe>'
    );
    const pitch = parseSlideEmbed('<iframe src="https://pitch.com/embed/demo-pitch-public-id"></iframe>');
    const powerpoint = parseSlideEmbed(
      '<iframe src="https://onedrive.live.com/embed?resid=DEMO123&authkey=Ademo&em=2" width="640" height="480"></iframe>'
    );

    expect(figma.ok && figma.platform).toBe('figma');
    expect(pitch.ok && pitch.platform).toBe('pitch');
    expect(powerpoint.ok && powerpoint.platform).toBe('powerpoint');

    if (figma.ok) {
      expect(figma.src).toContain('embed-host=classroomio');
    }
  });
});
