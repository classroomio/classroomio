import showAppsSideBar from './showAppsSideBar';
describe('ShowAppSideBar', () => {
  test("should return true when path includes '/lessons/' and does not include 'landingpage'", () => {
    const path = '/lessons/example';
    const result = showAppsSideBar(path);
    expect(result).toBe(true);
  });

  test("should return false when path does not include '/lessons/'", () => {
    const path = '/home';
    const result = showAppsSideBar(path);
    expect(result).toBe(false);
  });

  test("should return false when path includes 'landingpage'", () => {
    const path = '/lessons/landingpage';
    const result = showAppsSideBar(path);
    expect(result).toBe(false);
  });

  test('should return false when path is empty', () => {
    const path = '';
    const result = showAppsSideBar(path);
    expect(result).toBe(false);
  });
});
