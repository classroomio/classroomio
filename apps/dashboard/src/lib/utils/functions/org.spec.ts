import { genQuizPin, generateSitename } from './org';

describe('Generate Quiz Pin', () => {
  test('should return a random 6-digit pin', () => {
    const result = genQuizPin();
    expect(result.toString().length).toBe(6);
  });

  test('should return random pin each time', () => {
    const result1 = genQuizPin();
    const result2 = genQuizPin();
    expect(result1).not.toBe(result2);
  });

  test('should generate a pin between 100000 and 999999', () => {
    const result = genQuizPin();
    expect(result).toBeGreaterThanOrEqual(100000);
    expect(result).toBeLessThanOrEqual(999999);
  });

  test('should not generate a negative pin', () => {
    const result = genQuizPin();
    expect(result).toBeGreaterThanOrEqual(0);
  });

  test('should generate an integer pin', () => {
    const result = genQuizPin();
    expect(Number.isInteger(result)).toBe(true);
  });

  test('should not generate a zero pin', () => {
    const result = genQuizPin();
    expect(result).not.toBe(0);
  });
});

describe('Generate Site name', () => {
  test('should return slug-like string', () => {
    const result = generateSitename('classroom org international');
    const expected = 'classroom-org-international';
    expect(result).toBe(expected);
  });
  test('should remove special characters', () => {
    const result = generateSitename('classroom@ org! international');
    const expected = 'classroom-org-international';
    expect(result).toBe(expected);
  });

  test('should return empty string when orgName is an empty string', () => {
    const result = generateSitename('');
    const expected = '';
    expect(result).toBe(expected);
  });

  test('should return slug-like string with all uppercase characters converted to lowercase', () => {
    const result = generateSitename('Classroom Org International');
    const expected = 'classroom-org-international';
    expect(result).toBe(expected);
  });
});
