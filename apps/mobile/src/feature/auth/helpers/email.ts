const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEmail(value: string) {
  return EMAIL_PATTERN.test(value.trim());
}

export function emailDomainOf(email: string) {
  return email.trim().toLowerCase().split('@')[1] ?? '';
}
