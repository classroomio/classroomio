import { isCourseFree } from './course';

describe('course.ts', () => {
  test('Should return True when cost is 0', () => {
    const result = isCourseFree(0);
    expect(result).toBeTruthy();
  });

  test('Should return true when cost is negative', () => {
    const result = isCourseFree(-10);
    expect(result).toBeTruthy();
  });

  test('Should return True when cost is Not A Number', () => {
    const result = isCourseFree(NaN);
    expect(result).toBeTruthy();
  });
});
