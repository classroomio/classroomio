import getCurrencyFormatter from './getCurrencyFormatter';

describe('GetCurrencyFormatter', () => {
  test('should return a new instance of Intl.NumberFormat with the correct locale and currency options when currency is "NGN"', () => {
    const result = getCurrencyFormatter('NGN');
    expect(result).toBeInstanceOf(Intl.NumberFormat);
    expect(result.resolvedOptions().locale).toBe('en-NG');
    expect(result.resolvedOptions().currency).toBe('NGN');
    expect(result.resolvedOptions().minimumFractionDigits).toBe(2);
  });

  test('should return a new instance of Intl.NumberFormat with the correct locale and currency options when currency is "USD"', () => {
    const result = getCurrencyFormatter('USD');
    expect(result).toBeInstanceOf(Intl.NumberFormat);
    expect(result.resolvedOptions().locale).toBe('en-US');
    expect(result.resolvedOptions().currency).toBe('USD');
    expect(result.resolvedOptions().minimumFractionDigits).toBe(2);
  });

  test('should return a new instance of Intl.NumberFormat with the correct locale and currency options when currency is "EUR"', () => {
    const result = getCurrencyFormatter('EUR');
    expect(result).toBeInstanceOf(Intl.NumberFormat);
    expect(result.resolvedOptions().locale).toBe('en-US');
    expect(result.resolvedOptions().currency).toBe('EUR');
    expect(result.resolvedOptions().minimumFractionDigits).toBe(2);
  });
});
