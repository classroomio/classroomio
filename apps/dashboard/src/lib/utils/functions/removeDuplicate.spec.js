import { removeDuplicate } from './removeDuplicate';

describe('removeDuplicate', () => {
  test('should remove duplicate elements of an array', () => {
    const result = removeDuplicate([1, 1, 2, 3, 3, 4, 5]);
    const expected = [1, 2, 3, 4, 5];
    expect(result).toStrictEqual(expected);
    expect(result.length).toBe(5);
  });

  test('should return an empty array', () => {
    const result = removeDuplicate([]);
    const expected = [];
    expect(result).toStrictEqual(expected);
    expect(result.length).toBe(0);
  });

  test('should return an array with the same element', () => {
    const result = removeDuplicate([1]);
    const expected = [1];
    expect(result).toStrictEqual(expected);
    expect(result.length).toBe(1);
  });

  test('should return an array with only one element', () => {
    const result = removeDuplicate([1, 1, 1, 1]);
    const expected = [1];
    expect(result).toStrictEqual(expected);
    expect(result.length).toBe(1);
  });

  test('should return an array with the unique elements in the same order as the original array', () => {
    const result = removeDuplicate([1, 2, 3, 4, 5, 1, 2, 3, 4, 5]);
    const expected = [1, 2, 3, 4, 5];
    expect(result).toStrictEqual(expected);
    expect(result.length).toBe(5);
  });
});
