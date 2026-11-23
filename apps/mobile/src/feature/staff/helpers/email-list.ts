const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Splits a typed list of addresses on commas, semicolons and whitespace, de-duplicated and split by validity. */
export function parseEmailList(text: string) {
  const entries = [
    ...new Set(
      text
        .split(/[\s,;]+/)
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean)
    )
  ];

  return {
    valid: entries.filter((entry) => EMAIL.test(entry)),
    invalid: entries.filter((entry) => !EMAIL.test(entry))
  };
}
