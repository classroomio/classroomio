export default (currency: string | undefined) => {
  const locale = currency == 'NGN' ? 'en-NG' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  });
};
