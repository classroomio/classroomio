export default (path: string): boolean => {
  return ['login', 'signup', 'onboarding'].some((r) => path.includes(r)) || path === '';
};
