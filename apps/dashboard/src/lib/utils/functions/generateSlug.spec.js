import '@testing-library/jest-dom';
import generateSlug from './generateSlug';

describe('generateSlug', () => {
  // Returns a string with lowercase letters and hyphens
  test('should return a string with lowercase letters and hyphens when given a valid title', () => {
    const title = 'This is a Valid Title';
    const expected = 'this-is-a-valid-title';
    const result = generateSlug(title);
    expect(result).toBe(expected);
  });

  // Includes the current timestamp at the end of the string
  test('should include the current timestamp at the end of the string', () => {
    const title = 'This is a Valid Title';
    const result = generateSlug(title);
    const timestamp = result.split('-').pop();
    expect(Number(timestamp)).toBeGreaterThan(0);
  });
});
