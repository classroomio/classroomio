export const isCourseFree = (cost: number) => !(Number(cost) > 0);

export type CoursePaidSource = {
  cost?: number | null;
  metadata?: { paymentEnabled?: boolean; discount?: number; showDiscount?: boolean } | null;
} | null;

export const isCoursePaid = (course: CoursePaidSource) => {
  const paidFlag = course?.metadata?.paymentEnabled;
  if (typeof paidFlag === 'boolean') return paidFlag;
  return !isCourseFree(Number(course?.cost ?? 0));
};

export function calcCourseCost(course: CoursePaidSource): number {
  if (!isCoursePaid(course)) return 0;

  const cost = Number(course?.cost ?? 0);
  const discount = course?.metadata?.discount ?? 0;
  const showDiscount = course?.metadata?.showDiscount ?? false;
  return calcCourseDiscount(discount, cost, showDiscount);
}

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
