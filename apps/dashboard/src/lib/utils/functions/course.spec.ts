import '@testing-library/jest-dom';
import { isCourseFree } from './course';

describe('course-function', () => {
  test('isCourseFree', () => {
    const result = isCourseFree(0);
    expect(result).toBeFalsy();
  });
});
