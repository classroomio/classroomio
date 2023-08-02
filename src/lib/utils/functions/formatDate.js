export default (date) => {
  const d = new Date(date);

  const ye = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(d);
  const mo = new Intl.DateTimeFormat('en', { month: '2-digit' }).format(d);
  const da = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(d);

  // return `${ye}-${mo}-${da} ${d.toLocaleTimeString('en-US')}`;
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'full',
    timeStyle: 'medium',
  }).format(d);
};
