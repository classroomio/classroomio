export function capitalizeFirstLetter(val: string): string {
  return val.charAt(0).toUpperCase() + val.slice(1);
}

export function shortenName(name: string | null | undefined): string {
  return name?.substring(0, 2)?.toUpperCase() || '';
}
