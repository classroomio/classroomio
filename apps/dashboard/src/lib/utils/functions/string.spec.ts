import { capitalizeFirstLetter } from './string';

describe('capitalize first letter', () => {
  test('should return the same string with the first letter capitalized', () => {
    const result = capitalizeFirstLetter('classroom');
    expect(result).toEqual('Classroom');
  });

  test('should return an empty string when given an empty string', () => {
    const result = capitalizeFirstLetter('');
    expect(result).toEqual('');
  });

  test('should return the same string when given a string with all uppercase letters', () => {
    const result = capitalizeFirstLetter('UPPERCASE');
    expect(result).toEqual('UPPERCASE');
  });

  test('should return the same string when given a string with a non-alphabetical first character', () => {
    const result = capitalizeFirstLetter('123abc');
    expect(result).toEqual('123abc');
  });

  test('should return the first letter of the first word capitalized when given a sentence', () => {
    const result = capitalizeFirstLetter('classroomio is an open source project');
    expect(result).toEqual('Classroomio is an open source project');
  });
});
