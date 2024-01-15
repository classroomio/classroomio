import '@testing-library/jest-dom';

beforeEach(() => {
  // reset dom before each test
  document.getElementsByTagName('html')[0].innerHTML = '';
});
