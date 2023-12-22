import { isObject } from './isObject';

describe('isObject', () => {
  test('should return true for an empty object', () => {
    const obj = {};
    expect(isObject(obj)).toBe(true);
  });

  test('should return false for a non-object', () => {
    const obj = 'not an object';
    expect(isObject(obj)).toBe(false);
  });

  test('should return true for a nested object', () => {
    const obj = { prop1: { prop2: 'value2' } };
    expect(isObject(obj)).toBe(true);
  });

  test('should return true for an object with properties', () => {
    const obj = { prop1: 'value1', prop2: 'value2' };
    expect(isObject(obj)).toBe(true);
  });
});
