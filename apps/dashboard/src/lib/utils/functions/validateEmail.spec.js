import { validateEmail } from './validateEmail';

describe('validate email', () => {
  test('should return true for a valid email format', () => {
    const result = validateEmail('test@example.com');
    expect(result).toBeTruthy();
  });

  test('should return false for an empty email', () => {
    const result = validateEmail('');
    expect(result).toBeFalsy();
  });

  test('should return true for a valid email with uppercase letters', () => {
    const result = validateEmail('Test@Example.com');
    expect(result).toBeTruthy();
  });

  test('should return false for an invalid email format', () => {
    const result = validateEmail('test@example');
    expect(result).toBeFalsy();
  });

  test('should return true for a valid email with special characters', () => {
    const result = validateEmail('test+123@example.com');
    expect(result).toBeTruthy();
  });
});
