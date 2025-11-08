function showAppsSideBar(path) {
  return path?.includes('/lessons/') && !path?.includes('landingpage');
}

export default showAppsSideBar;
