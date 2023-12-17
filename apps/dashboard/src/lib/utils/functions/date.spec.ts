import '@testing-library/jest-dom';
import { calDateDiff, getGreeting } from './date';

describe('calDateDiff', () => {
  test('should return the correct time difference when the input date is in the past', () => {
    const inputDate = new Date('2022-01-01');
    const expectedOutput = '2 years ago';

    const result = calDateDiff(inputDate);

    expect(result).toBe(expectedOutput);
  });

  test('should return the correct time difference when the input date is a number', () => {
    const inputDate = new Date(1640995200000); // January 1, 2022
    const expectedOutput = '2 years ago';

    const result = calDateDiff(inputDate);

    expect(result).toBe(expectedOutput);
  });
});

describe('getGreeting', () => {
  test("should return 'Good Morning' when the current time is before 12pm", () => {
    jest.useFakeTimers().setSystemTime(new Date('2023-12-10T00:21:01.691Z'));
    expect(getGreeting()).toBe('Good Morning');
  });
  test("should return 'Good Afternoon' when the current time is after 12pm", () => {
    jest.useFakeTimers().setSystemTime(new Date('2023-12-10T14:21:01.691Z'));
    expect(getGreeting()).toBe('Good Afternoon');
  });
  test("should return 'Good Evening' when the current time is after 6pm", () => {
    jest.useFakeTimers().setSystemTime(new Date('2023-12-10T19:21:01.691Z'));
    expect(getGreeting()).toBe('Good Evening');
  });
});
