export function calcPercentageWithRounding(a: number, b: number) {
  if (b === 0) {
    return 0;
  }
  const rawPercentage = (a / b) * 100;
  const fixedString = rawPercentage.toFixed(1);
  const roundedNumber = parseFloat(fixedString);

  return isNaN(roundedNumber) ? 0 : roundedNumber;
}
