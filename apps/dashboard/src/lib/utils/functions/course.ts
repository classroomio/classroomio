export const isCourseFree = (cost: number) => !(Number(cost) > 0);

const tagsToReplace: { [k: string]: string } = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;'
};

export function replaceHTMLTag(text: string) {
  return text
    .split('')
    .map((char) => tagsToReplace[char] || char)
    .join('');
}

export function calcCourseDiscount(percent = 0, cost: number, showDiscount: boolean) {
  if (!percent || !showDiscount) return cost;
  const discountAmount = (percent / 100) * cost;
  const discountedPrice = cost - discountAmount;
  return Math.round(discountedPrice);
}
