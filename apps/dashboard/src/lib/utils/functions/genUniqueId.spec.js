import genUniqueId from './genUniqueId';

describe('Generate Unique Ids', () => {
  test('should start with letter', () => {
    const result = genUniqueId();
    const firstChar = result.charAt(0);
    expect(firstChar).toMatch(/[a-zA-Z]/);
  });

  test('should not contain special characters', () => {
    const result = genUniqueId();
    expect(result).toMatch(/^[a-zA-Z0-9]+$/);
  });

  test('should return different ids on multiple calls', () => {
    const result1 = genUniqueId();
    const result2 = genUniqueId();
    expect(result1).not.toEqual(result2);
  });
  test('multiple calls in closer time frames should have same first 3 letters', () => {
    const result1 = genUniqueId();
    const result2 = genUniqueId();
    expect(result1.substring(0, 4)).toEqual(result2.substring(0, 4));
  });
});
