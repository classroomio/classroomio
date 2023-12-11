import '@testing-library/jest-dom';
import { formatYoutubeVideo, getEmbedId } from './formatYoutubeVideo';

describe('format youtube video', () => {
  test('should return the same url when given a valid youtube embed url', () => {
    const url = 'https://www.youtube.com/embed/qajK1J1neAM';
    const errors = { video: '' };
    const result = formatYoutubeVideo(url, errors);
    expect(result).toBe(url);
  });

  test('should return the correct embed url when given a youtube url with a start time parameter', () => {
    const url = 'https://www.youtube.com/watch?v=qajK1J1neAM&start=123';
    const errors = { video: '' };
    const result = formatYoutubeVideo(url, errors);
    expect(result).toBe('https://www.youtube.com/embed/qajK1J1neAM');
  });
});

describe('getEmbedId', () => {
  test('should return the correct embed id when the url contains "embed"', () => {
    const url = 'https://www.youtube.com/embed/qajK1J1neAM';
    const expectedEmbedId = 'qajK1J1neAM';

    const result = getEmbedId(url);

    expect(result).toBe(expectedEmbedId);
  });

  test('should return an empty string when the url does not contain "watch" or "embed" and is not in the format "youtu.be/"', () => {
    const url = 'https://www.youtube.com/invalid-url';
    const expectedEmbedId = '';

    const result = getEmbedId(url);

    expect(result).toBe(expectedEmbedId);
  });

  test('should return an empty string when the url is an empty string', () => {
    const url = '';
    const expectedEmbedId = '';

    const result = getEmbedId(url);

    expect(result).toBe(expectedEmbedId);
  });
});
