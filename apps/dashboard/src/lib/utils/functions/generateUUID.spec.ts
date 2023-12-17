import generateUUID from './generateUUID';
import { isUUID } from './isUUID';

// This test suite tests both the generateUUID and isUUID functions
describe('GenerateUUID', () => {
  test('should be true when tested with the uuid function', () => {
    const result = generateUUID();
    expect(isUUID(result)).toBe(true);
  });

  test('should generate unique UUIDs each time', () => {
    const uuid1 = generateUUID();
    const uuid2 = generateUUID();
    expect(uuid1).not.toBe(uuid2);
  });

  test('should return true for a valid UUID', () => {
    const uuid = '123e4567-e89b-12d3-a456-426614174000';
    expect(isUUID(uuid)).toBe(true);
  });

  test('should return false for an invalid UUID', () => {
    const uuid = 'invalid-uuid';
    expect(isUUID(uuid)).toBe(false);
  });
});
