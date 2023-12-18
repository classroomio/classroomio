import isSubmissionEarly from './isSubmissionEarly';

describe('isSubmissionEarly', () => {
  test('should return true when createdAt is earlier than dueDate', () => {
    const dueDate = Date.now();
    const createdAt = new Date('2023-12-15');
    const result = isSubmissionEarly(createdAt, dueDate);
    expect(result).toBe(true);
  });

  test('should return true when both createdAt and dueDate are null', () => {
    const dueDate = null;
    const createdAt = null;
    const result = isSubmissionEarly(createdAt, dueDate);
    expect(result).toBe(true);
  });
  test('should return true when createdAt is the same as dueDate', () => {
    const dueDate = new Date('2023-12-15');
    const createdAt = new Date('2023-12-15');
    const result = isSubmissionEarly(createdAt, dueDate);
    expect(result).toBe(true);
  });

  test('should return false when createdAt is later than dueDate', () => {
    const dueDate = new Date('2023-12-15');
    const createdAt = new Date('2023-12-16');
    const result = isSubmissionEarly(createdAt, dueDate);
    expect(result).toBe(false);
  });
});
