export function observeIntersection(node, callback, options = {}) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        callback(true);
      } else {
        callback(false);
      }
    });
  }, options);

  observer.observe(node);

  return {
    destroy() {
      observer.unobserve(node);
    }
  };
}
