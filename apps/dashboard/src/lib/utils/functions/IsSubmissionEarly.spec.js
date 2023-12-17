import isSubmissionEarly from './isSubmissionEarly';

describe('isSubmissionEarly', () => {
  test('should return true when createdAt is earlier than dueDate', () => {
    const due_date = Date.now();
    const created_at = new Date('2023-12-15');
    const result = isSubmissionEarly(created_at, due_date);
    expect(result).toBe(true);
  });

  test('should return true when both created_at and due_date are null', () => {
    const due_date = null;
    const created_at = null;
    const result = isSubmissionEarly(created_at, due_date);
    expect(result).toBe(true);
  });
  test('should return true when created_at is the same as due_date', () => {
    const due_date = new Date('2023-12-15');
    const created_at = new Date('2023-12-15');
    const result = isSubmissionEarly(created_at, due_date);
    expect(result).toBe(true);
  });

  test('should return false when created_at is later than due_date', () => {
    const due_date = new Date('2023-12-15');
    const created_at = new Date('2023-12-16');
    const result = isSubmissionEarly(created_at, due_date);
    expect(result).toBe(false);
  });
});
